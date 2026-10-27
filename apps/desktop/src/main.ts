import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, dialog, Menu, type MenuItemConstructorOptions, shell } from 'electron'
import { type Atualizador, type EstadoAtualizacao, iniciarAtualizador } from './atualizador'
import { progressoDaBarra, scriptDoAviso } from './aviso-atualizacao'
import { carregarComNovasTentativas } from './carregamento'
import { criarAtualizador } from './criar-atualizador'
import { pedeDepuracao } from './depuracao'
import { podeAbrirFora } from './links-externos'
import { carregarOuCriarSegredo, escolherPorta, montarAmbiente } from './runtime'
import { mostrarTelaDeEspera, paginaSimples } from './tela-de-espera'

/** Mesmo nome emitido pelo servidor (RestauracaoService). */
const EVENTO_REINICIAR = 'brastem:reiniciar'
/** O botão "Procurar atualização" da tela chega pelo servidor embutido (mesmo processo). */
const EVENTO_PROCURAR_ATUALIZACAO = 'brastem:procurar-atualizacao'

/** Onde baixar o instalador à mão quando a atualização automática não funciona. */
const PAGINA_DE_DOWNLOADS = 'https://github.com/brunolimao/brastem-service/releases/latest'

interface ServidorEmbutido {
  close(): Promise<void>
}

let servidor: ServidorEmbutido | undefined
let janela: BrowserWindow | undefined
let encerrando = false
let atualizador: Atualizador | undefined

// Instalado, o app não abre em modo de depuração remota (ver depuracao.ts). Em desenvolvimento pode.
if (app.isPackaged && pedeDepuracao(process.argv)) app.exit(1)

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
      versao: app.getVersion(),
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

/** Mostra o andamento da atualização na janela (canto da tela) e na barra de tarefas. */
let estadoDaAtualizacao: EstadoAtualizacao = { tipo: 'nenhum' }

function mostrarAtualizacao(estado: EstadoAtualizacao) {
  estadoDaAtualizacao = estado
  if (!janela || janela.isDestroyed()) return
  const progresso = progressoDaBarra(estado)
  if (progresso === 2) janela.setProgressBar(2, { mode: 'indeterminate' })
  else janela.setProgressBar(progresso)
  janela.webContents.executeJavaScript(scriptDoAviso(estado)).catch(() => undefined)
}

/** Origem do app depois que o servidor sobe; a janela não navega para fora dela. */
let origemDoApp: string | undefined

/**
 * Abre a janela com a tela de espera e resolve quando ela já está desenhada na tela; só então o servidor
 * sobe (ver `mostrarTelaDeEspera`) e, depois, o app carrega (ver `carregarApp`).
 */
function abrirJanela(): Promise<void> {
  janela = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    autoHideMenuBar: true,
    backgroundColor: '#0b1220',
    // Aparece só com o "Iniciando…" já desenhado, nunca como um quadro azul vazio.
    show: false,
    title: 'Brastem-Service',
    icon: app.isPackaged ? join(raiz, 'icone.png') : join(__dirname, '..', 'recursos', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  // A página recarrega ao navegar/reiniciar o front: refaz o aviso se ainda houver atualização em andamento.
  janela.webContents.on('did-finish-load', () => mostrarAtualizacao(estadoDaAtualizacao))

  // A janela só navega dentro do próprio app; links externos abrem no navegador do sistema.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (podeAbrirFora(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  // O app não usa câmera, microfone, localização, notificações etc.: nega qualquer pedido.
  janela.webContents.session.setPermissionRequestHandler((_conteudo, _permissao, responder) =>
    responder(false),
  )
  janela.webContents.on('will-navigate', (evento, url) => {
    if (new URL(url).origin !== origemDoApp) evento.preventDefault()
  })

  return mostrarTelaDeEspera(janela)
}

/**
 * Carrega o app na janela, com novas tentativas (ver carregamento.ts). Se nada der certo, mostra uma
 * mensagem com "Tentar de novo" em vez de deixar a janela em branco.
 */
async function carregarApp(endereco: string) {
  origemDoApp = new URL(endereco).origin
  enderecoDoApp = endereco
  const alvo = janela
  if (!alvo) return
  const carregou = await carregarComNovasTentativas((url) => alvo.loadURL(url), endereco, {
    registrar: (mensagem) => console.log(`[janela] ${mensagem}`),
  })
  if (!carregou && !alvo.isDestroyed()) {
    void alvo.loadURL(
      paginaSimples('Não foi possível abrir o Brastem-Service.', false, {
        link: { rotulo: 'Tentar de novo', endereco },
      }),
    )
  }
}

/** Endereço do app, depois que o servidor sobe. */
let enderecoDoApp: string | undefined

/**
 * O servidor não subiu. A causa pode ser um defeito desta versão, e a correção vem por atualização:
 * por isso o atualizador já está ligado e o usuário pode procurar uma versão nova daqui mesmo.
 */
async function falhaAoIniciar(erro: unknown) {
  const detalhe = erro instanceof Error ? erro.message : String(erro)
  void janela?.loadURL(paginaSimples('O Brastem-Service não conseguiu iniciar.', false))
  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: 'O Brastem-Service não conseguiu iniciar',
    message: 'O Brastem-Service não conseguiu iniciar.',
    detail: `${detalhe}\n\nOs registros ficam em:\n${join(pastaDeDados(), 'logs')}`,
    buttons: app.isPackaged ? ['Procurar atualização', 'Fechar'] : ['Fechar'],
    defaultId: 0,
    cancelId: app.isPackaged ? 1 : 0,
  })
  if (!app.isPackaged || response !== 0) return app.quit()

  void janela?.loadURL(paginaSimples('Procurando uma versão corrigida…', true))
  const resultado = (await atualizador?.verificar()) ?? 'erro'
  // Achou: o download segue com o aviso na janela e, no fim, a pergunta de reiniciar instala a correção.
  if (resultado === 'atualizacao-encontrada') return

  const { response: escolha } = await dialog.showMessageBox({
    type: 'warning',
    message:
      resultado === 'erro'
        ? 'Não foi possível procurar atualizações. Confira a internet e tente de novo.'
        : 'Ainda não há uma versão mais nova disponível.',
    buttons: ['Abrir página de downloads', 'Fechar'],
    cancelId: 1,
  })
  if (escolha === 0) await shell.openExternal(PAGINA_DE_DOWNLOADS)
  app.quit()
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
      // Botão "Procurar atualização" da tela: o mesmo que Ajuda → Verificar atualizações.
      process.on(EVENTO_PROCURAR_ATUALIZACAO, () => void verificarAtualizacaoAgora())
      // A tela de backup prepara a troca do banco e pede para reiniciar; a troca acontece ao abrir de novo.
      process.on(EVENTO_REINICIAR, () => {
        app.relaunch()
        app.quit()
      })
      const telaDeEspera = abrirJanela()
      // Antes do servidor: se esta versão não conseguir iniciar, ainda dá para receber a correção.
      atualizador = iniciarAtualizador({
        empacotado: app.isPackaged,
        autoUpdater: criarAtualizador(
          // A primeira é a pasta padrão do electron-updater; as outras só entram se ela não aceitar renomear (EFS).
          [process.env.LOCALAPPDATA ?? '', app.getPath('userData'), app.getPath('temp')],
          (mensagem) => console.log(`[atualizador] ${mensagem}`),
        ),
        registrar: (mensagem) => console.log(`[atualizador] ${mensagem}`),
        aoMudarEstado: mostrarAtualizacao,
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
      // Só com o "Iniciando…" na tela: subir o servidor trava este processo por alguns segundos.
      await telaDeEspera
      await carregarApp(await iniciarServidor())
    })
    // Se até a tela de erro falhar, ao menos não fica um processo aberto sem janela.
    .catch((erro) => falhaAoIniciar(erro).catch(() => app.quit()))

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

  // Se o serviço de rede cair com o app aberto, os pedidos ao servidor local passam a falhar: recarrega.
  app.on('child-process-gone', (_evento, detalhes) => {
    if (detalhes.type !== 'Utility' || detalhes.name !== 'Network Service') return
    console.log(`[janela] serviço de rede caiu (${detalhes.reason}); recarregando`)
    if (janela && !janela.isDestroyed() && enderecoDoApp) void carregarApp(enderecoDoApp)
  })

  app.on('window-all-closed', () => app.quit())
}
