import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { type AutoUpdaterMinimo, iniciarAtualizador } from './atualizador'

/** electron-updater de mentira: emite os mesmos eventos e deixa o teste escolher o que `checkForUpdates` devolve. */
function criarAutoUpdaterFalso() {
  const eventos = new EventEmitter()
  const falso = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    on: (evento: string, ouvinte: Parameters<EventEmitter['on']>[1]) => eventos.on(evento, ouvinte),
    checkForUpdates: vi.fn(
      async (): Promise<{ isUpdateAvailable?: boolean } | null> => ({
        isUpdateAvailable: false,
      }),
    ),
    quitAndInstall: vi.fn(),
  }
  return { falso: falso as unknown as AutoUpdaterMinimo & typeof falso, eventos }
}

const preparar = (empacotado = true) => {
  const { falso, eventos } = criarAutoUpdaterFalso()
  const registrar = vi.fn()
  const perguntarReiniciar = vi.fn(async () => true)
  const cancelar = vi.fn()
  const repetir = vi.fn(() => cancelar)
  const aoMudarEstado = vi.fn()
  const atualizador = iniciarAtualizador({
    empacotado,
    autoUpdater: falso,
    perguntarReiniciar,
    registrar,
    repetir,
    aoMudarEstado,
    esperarAntesDeInstalar: async () => undefined,
  })
  return {
    falso,
    eventos,
    registrar,
    perguntarReiniciar,
    repetir,
    cancelar,
    atualizador,
    aoMudarEstado,
  }
}

describe('atualizador', () => {
  it('não faz nada quando o app não está instalado (modo desenvolvimento)', async () => {
    const { falso, repetir, atualizador } = preparar(false)
    expect(falso.checkForUpdates).not.toHaveBeenCalled()
    expect(repetir).not.toHaveBeenCalled()
    expect(await atualizador.verificar()).toBe('atualizado')
  })

  it('baixa sozinho, instala ao fechar e verifica logo ao abrir e a cada 4 horas', () => {
    const { falso, repetir } = preparar()
    expect(falso.autoDownload).toBe(true)
    expect(falso.autoInstallOnAppQuit).toBe(true)
    expect(falso.checkForUpdates).toHaveBeenCalledOnce()
    expect(repetir).toHaveBeenCalledWith(expect.any(Function), 4 * 60 * 60 * 1000)
  })

  it('quando a atualização baixa e o usuário aceita, instala mostrando o progresso e reabre o app', async () => {
    const { falso, eventos, perguntarReiniciar, aoMudarEstado } = preparar()
    eventos.emit('update-downloaded', { version: '2.1.0' })
    await vi.waitFor(() => expect(falso.quitAndInstall).toHaveBeenCalledWith(false, true))
    expect(perguntarReiniciar).toHaveBeenCalledWith('2.1.0')
    // Antes de fechar o app, o usuário vê que a instalação começou.
    expect(aoMudarEstado).toHaveBeenCalledWith({ tipo: 'instalando', versao: '2.1.0' })
  })

  it('quando o usuário escolhe "depois", não reinicia (instala ao fechar)', async () => {
    const { falso, eventos, perguntarReiniciar } = preparar()
    perguntarReiniciar.mockResolvedValueOnce(false)
    eventos.emit('update-downloaded', { version: '2.1.0' })
    await vi.waitFor(() => expect(perguntarReiniciar).toHaveBeenCalled())
    expect(falso.quitAndInstall).not.toHaveBeenCalled()
  })

  it('falha de rede vira só um registro e nunca derruba o app', async () => {
    const { falso, registrar, atualizador } = preparar()
    falso.checkForUpdates.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND github.com'))
    expect(await atualizador.verificar()).toBe('erro')
    expect(registrar).toHaveBeenCalledWith(expect.stringContaining('ENOTFOUND'))
  })

  it('erros reportados pelo próprio updater também só vão para o registro', () => {
    const { eventos, registrar } = preparar()
    eventos.emit('error', new Error('assinatura inválida'))
    expect(registrar).toHaveBeenCalledWith('Falha ao verificar atualização: assinatura inválida')
  })

  it('diz se encontrou atualização ou se já está na versão mais recente', async () => {
    const { falso, atualizador } = preparar()
    falso.checkForUpdates.mockResolvedValueOnce({ isUpdateAvailable: true })
    expect(await atualizador.verificar()).toBe('atualizacao-encontrada')
    falso.checkForUpdates.mockResolvedValueOnce(null)
    expect(await atualizador.verificar()).toBe('atualizado')
  })

  it('parar cancela a verificação periódica', () => {
    const { atualizador, cancelar } = preparar()
    atualizador.parar()
    expect(cancelar).toHaveBeenCalledOnce()
  })

  it('avisa cada etapa: procurando, baixando com progresso, pronta, e some se não há nada novo', () => {
    const { falso, eventos } = criarAutoUpdaterFalso()
    const aoMudarEstado = vi.fn()
    iniciarAtualizador({
      empacotado: true,
      autoUpdater: falso,
      perguntarReiniciar: async () => false,
      registrar: vi.fn(),
      aoMudarEstado,
      repetir: () => () => undefined,
    })
    eventos.emit('checking-for-update')
    eventos.emit('update-available', { version: '2.1.0' })
    eventos.emit('download-progress', { percent: 41.6 })
    eventos.emit('update-downloaded', { version: '2.1.0' })
    eventos.emit('update-not-available')
    expect(aoMudarEstado.mock.calls.map(([estado]) => estado)).toEqual([
      { tipo: 'verificando' },
      { tipo: 'baixando', versao: '2.1.0', percentual: 0 },
      { tipo: 'baixando', versao: '2.1.0', percentual: 42 },
      { tipo: 'pronta', versao: '2.1.0' },
      { tipo: 'nenhum' },
    ])
  })
})
