/** Só o que usamos do `autoUpdater` do electron-updater (facilita trocar por um falso nos testes). */
export interface AutoUpdaterMinimo {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  on(evento: 'update-downloaded', ouvinte: (info: { version: string }) => void): unknown
  on(evento: 'update-available', ouvinte: (info: { version: string }) => void): unknown
  on(evento: 'update-not-available', ouvinte: () => void): unknown
  on(evento: 'error', ouvinte: (erro: Error) => void): unknown
  checkForUpdates(): Promise<{ isUpdateAvailable?: boolean } | null | undefined>
  quitAndInstall(silencioso?: boolean, reabrir?: boolean): void
}

export interface OpcoesAtualizador {
  /** Só o app instalado se atualiza; em desenvolvimento não há o que atualizar. */
  empacotado: boolean
  autoUpdater: AutoUpdaterMinimo
  /** Pergunta ao usuário; devolve true se ele quer reiniciar agora. */
  perguntarReiniciar: (versao: string) => Promise<boolean>
  registrar: (mensagem: string) => void
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

  autoUpdater.on('update-available', (info) =>
    registrar(`Atualização ${info.version} encontrada; baixando.`),
  )
  autoUpdater.on('update-not-available', () => registrar('O app já está na versão mais recente.'))
  autoUpdater.on('error', (erro) => registrar(`Falha ao verificar atualização: ${erro.message}`))
  autoUpdater.on('update-downloaded', (info) => {
    registrar(`Atualização ${info.version} baixada.`)
    void perguntarReiniciar(info.version).then((reiniciar) => {
      // Silenciosa e reabrindo o app: o usuário volta direto ao trabalho.
      if (reiniciar) autoUpdater.quitAndInstall(true, true)
    })
  })

  const verificar = async (): Promise<ResultadoVerificacao> => {
    try {
      const resultado = await autoUpdater.checkForUpdates()
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
