import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, dialog, Menu, type MenuItemConstructorOptions, shell } from 'electron'
import { type Atualizador, iniciarAtualizador } from './atualizador'
import { criarAtualizador } from './criar-atualizador'
import { carregarOuCriarSegredo, escolherPorta, montarAmbiente } from './runtime'

/** Mesmo nome emitido pelo servidor (RestauracaoService). */
const EVENTO_REINICIAR = 'brastem:reiniciar'

/** Onde baixar o instalador à mão quando a atualização automática não funciona. */
const PAGINA_DE_DOWNLOADS = 'https://github.com/brunolimao/brastem-service/releases/latest'

interface ServidorEmbutido {
  close(): Promise<void>
}

let servidor: ServidorEmbutido | undefined
let janela: BrowserWindow | undefined
let encerrando = false
let atualizador: Atualizador | undefined

// Mesmo nome instalado ou não, para a pasta de dados (%APPDATA%\Brastem-Service) ser sempre a mesma.
app.setName('Brastem-Service')

// Fora do instalador (npm start) o servidor e o front ficam em .stage; instalado, em resources/.
const raiz = app.isPackaged ? process.resourcesPath : join(__dirname, '..', '.stage')

// BRASTEM_PASTA_DADOS existe para testes e instalações portáteis; o normal é a pasta do usuário.
const pastaDeDados = () => process.env.BRASTEM_PASTA_DADOS ?? join(app.getPath('userData'), 'dados')

async function iniciarServidor(): Promise<string> {
  const pastaDados = pastaDeDados()
  const porta = await escolherPorta()

  // O servidor lê a configuração do ambiente ao ser carregado, então isto vem antes do import.
  Object.assign(
    process.env,
    montarAmbiente({
      pastaDados,
      pastaInterface: join(raiz, 'client'),
      segredo: carregarOuCriarSegredo(pastaDados),
      porta,
    }),
  )

  const entrada = pathToFileURL(join(raiz, 'server', 'dist', 'bootstrap.js')).href
  const { bootstrap } = (await import(entrada)) as { bootstrap: () => Promise<ServidorEmbutido> }
  servidor = await bootstrap()
  return `http://127.0.0.1:${porta}`
}

function montarMenu(): Menu {
  const modelo: MenuItemConstructorOptions[] = [
    { label: 'Editar', role: 'editMenu' },
    {
      label: 'Exibir',
      submenu: [
        { role: 'zoomIn', accelerator: 'CommandOrControl+=' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Verificar atualizações', click: () => void verificarAtualizacaoAgora() },
        { type: 'separator' },
        { label: `Brastem-Service ${app.getVersion()}`, enabled: false },
      ],
    },
  ]
  return Menu.buildFromTemplate(modelo)
}

/** Menu Ajuda → Verificar atualizações: responde com uma mensagem, ao contrário da checagem silenciosa. */
async function verificarAtualizacaoAgora() {
  if (!app.isPackaged) {
    await dialog.showMessageBox({
      type: 'info',
      message: 'Atualizações só funcionam no app instalado.',
    })
    return
  }
  const resultado = (await atualizador?.verificar()) ?? 'erro'
  const mensagens = {
    'atualizacao-encontrada':
      'Há uma nova versão. Ela está sendo baixada e avisaremos quando estiver pronta.',
    atualizado: `Você já está na versão mais recente (${app.getVersion()}).`,
    erro: 'Não foi possível verificar agora. Confira a internet e tente de novo.',
  } as const
  const falhou = resultado === 'erro'
  const { response } = await dialog.showMessageBox({
    type: falhou ? 'warning' : 'info',
    message: mensagens[resultado],
    // Se a atualização automática não funciona, o usuário ainda consegue baixar o instalador novo.
    buttons: falhou ? ['Abrir página de downloads', 'Fechar'] : ['OK'],
    cancelId: falhou ? 1 : 0,
  })
  if (falhou && response === 0) void shell.openExternal(PAGINA_DE_DOWNLOADS)
}

function abrirJanela(endereco: string) {
  const origem = new URL(endereco).origin

  janela = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b1220',
    title: 'Brastem-Service',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  janela.once('ready-to-show', () => janela?.show())

  // A janela só navega dentro do próprio app; links externos abrem no navegador do sistema.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  janela.webContents.on('will-navigate', (evento, url) => {
    if (new URL(url).origin !== origem) evento.preventDefault()
  })

  void janela.loadURL(endereco)
}

function mostrarErroDeInicio(erro: unknown) {
  const detalhe = erro instanceof Error ? erro.message : String(erro)
  dialog.showErrorBox(
    'O Brastem-Service não conseguiu iniciar',
    `${detalhe}\n\nOs registros ficam em:\n${join(pastaDeDados(), 'logs')}`,
  )
}

// Uma única janela por vez: abrir de novo só traz a existente para frente.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (janela?.isMinimized()) janela.restore()
    janela?.focus()
  })

  app.setAppUserModelId('br.com.brastemservice.app')

  app
    .whenReady()
    .then(async () => {
      Menu.setApplicationMenu(montarMenu())
      // A tela de backup prepara a troca do banco e pede para reiniciar; a troca acontece ao abrir de novo.
      process.on(EVENTO_REINICIAR, () => {
        app.relaunch()
        app.quit()
      })
      abrirJanela(await iniciarServidor())
      atualizador = iniciarAtualizador({
        empacotado: app.isPackaged,
        autoUpdater: criarAtualizador(
          // A primeira é a pasta padrão do electron-updater; as outras só entram se ela não aceitar renomear (EFS).
          [process.env.LOCALAPPDATA ?? '', app.getPath('userData'), app.getPath('temp')],
          (mensagem) => console.log(`[atualizador] ${mensagem}`),
        ),
        registrar: (mensagem) => console.log(`[atualizador] ${mensagem}`),
        perguntarReiniciar: async (versao) => {
          const { response } = await dialog.showMessageBox({
            type: 'info',
            title: 'Atualização pronta',
            message: `A versão ${versao} do Brastem-Service foi baixada.`,
            detail:
              'Reiniciar agora leva alguns segundos. Se preferir, ela é instalada sozinha na próxima vez que você fechar o aplicativo.',
            buttons: ['Reiniciar agora', 'Depois'],
            defaultId: 0,
            cancelId: 1,
          })
          return response === 0
        },
      })
    })
    .catch((erro) => {
      mostrarErroDeInicio(erro)
      app.quit()
    })

  // Fecha o servidor (e o banco) com calma antes de sair, para não deixar o arquivo SQLite no meio de uma escrita.
  app.on('before-quit', (evento) => {
    atualizador?.parar()
    if (encerrando || !servidor) return
    evento.preventDefault()
    encerrando = true
    servidor
      .close()
      .catch(() => undefined)
      .finally(() => app.quit())
  })

  app.on('window-all-closed', () => app.quit())
}
