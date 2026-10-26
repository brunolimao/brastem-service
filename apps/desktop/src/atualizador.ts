/** Só o que usamos do `autoUpdater` do electron-updater (facilita trocar por um falso nos testes). */
export interface AutoUpdaterMinimo {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  on(evento: 'checking-for-update', ouvinte: () => void): unknown
  on(evento: 'download-progress', ouvinte: (progresso: { percent: number }) => void): unknown
  on(evento: 'update-downloaded', ouvinte: (info: { version: string }) => void): unknown
  on(evento: 'update-available', ouvinte: (info: { version: string }) => void): unknown
  on(evento: 'update-not-available', ouvinte: () => void): unknown
  on(evento: 'error', ouvinte: (erro: Error) => void): unknown
  checkForUpdates(): Promise<
    { isUpdateAvailable?: boolean; downloadPromise?: Promise<unknown> | null } | null | undefined
  >
  quitAndInstall(silencioso?: boolean, reabrir?: boolean): void
}

/** O que a janela mostra ao usuário durante a atualização. `nenhum` esconde o aviso. */
export type EstadoAtualizacao =
  | { tipo: 'nenhum' }
  | { tipo: 'verificando' }
  | { tipo: 'baixando'; versao: string; percentual: number }
  | { tipo: 'pronta'; versao: string }
  | { tipo: 'instalando'; versao: string }

export interface OpcoesAtualizador {
  /** Só o app instalado se atualiza; em desenvolvimento não há o que atualizar. */
  empacotado: boolean
  autoUpdater: AutoUpdaterMinimo
  /** Pergunta ao usuário; devolve true se ele quer reiniciar agora. */
  perguntarReiniciar: (versao: string) => Promise<boolean>
  registrar: (mensagem: string) => void
  /** Avisa a cada mudança de etapa, para a janela mostrar "procurando / baixando". */
  aoMudarEstado?: (estado: EstadoAtualizacao) => void
  /** Quanto esperar entre mostrar "instalando" e fechar o app, para o aviso ser visto. */
  esperarAntesDeInstalar?: () => Promise<void>
  /** Agenda `fn` a cada `ms` e devolve como cancelar (injetável para os testes). */
  repetir?: (fn: () => void, ms: number) => () => void
}

export type ResultadoVerificacao = 'atualizacao-encontrada' | 'atualizado' | 'erro'

export interface Atualizador {
  /** Procura atualização agora e diz o que achou (usado pelo menu Ajuda). */
  verificar(): Promise<ResultadoVerificacao>
  parar(): void
}

const QUATRO_HORAS_MS = 4 * 60 * 60 * 1000

/**
 * Baixa atualizações em segundo plano e, quando uma está pronta, pergunta se pode reiniciar.
 * Se o usuário disser "depois", ela é instalada sozinha quando ele fechar o app.
 * Falha de rede nunca atrapalha o uso: só vai para o registro.
 */
export function iniciarAtualizador({
  empacotado,
  autoUpdater,
  perguntarReiniciar,
  registrar,
  aoMudarEstado = () => undefined,
  esperarAntesDeInstalar = () => new Promise((resolver) => setTimeout(resolver, 2500)),
  repetir = (fn, ms) => {
    const id = setInterval(fn, ms)
    id.unref()
    return () => clearInterval(id)
  },
}: OpcoesAtualizador): Atualizador {
  if (!empacotado) {
    return { verificar: async () => 'atualizado', parar: () => undefined }
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  let versaoNova = ''
  autoUpdater.on('checking-for-update', () => aoMudarEstado({ tipo: 'verificando' }))
  autoUpdater.on('update-available', (info) => {
    versaoNova = info.version
    registrar(`Atualização ${info.version} encontrada; baixando.`)
    aoMudarEstado({ tipo: 'baixando', versao: info.version, percentual: 0 })
  })
  autoUpdater.on('download-progress', ({ percent }) =>
    aoMudarEstado({ tipo: 'baixando', versao: versaoNova, percentual: Math.round(percent) }),
  )
  autoUpdater.on('update-not-available', () => {
    registrar('O app já está na versão mais recente.')
    aoMudarEstado({ tipo: 'nenhum' })
  })
  autoUpdater.on('error', (erro) => {
    registrar(`Falha ao verificar atualização: ${erro.message}`)
    aoMudarEstado({ tipo: 'nenhum' })
  })
  autoUpdater.on('update-downloaded', (info) => {
    registrar(`Atualização ${info.version} baixada.`)
    aoMudarEstado({ tipo: 'pronta', versao: info.version })
    void perguntarReiniciar(info.version).then(async (reiniciar) => {
      if (!reiniciar) return
      // O instalador roda em silêncio: avisa antes de fechar, para o usuário saber que algo está acontecendo.
      aoMudarEstado({ tipo: 'instalando', versao: info.version })
      await esperarAntesDeInstalar()
      // Silenciosa e reabrindo o app: o usuário volta direto ao trabalho.
      autoUpdater.quitAndInstall(true, true)
    })
  })

  const verificar = async (): Promise<ResultadoVerificacao> => {
    try {
      const resultado = await autoUpdater.checkForUpdates()
      // Falha no download já chega pelo evento 'error' (registrado acima); sem isto vira rejeição não tratada.
      resultado?.downloadPromise?.catch(() => undefined)
      return resultado?.isUpdateAvailable ? 'atualizacao-encontrada' : 'atualizado'
    } catch (erro) {
      registrar(`Falha ao verificar atualização: ${erro instanceof Error ? erro.message : erro}`)
      return 'erro'
    }
  }

  const cancelar = repetir(() => void verificar(), QUATRO_HORAS_MS)
  void verificar()
  return { verificar, parar: cancelar }
}
