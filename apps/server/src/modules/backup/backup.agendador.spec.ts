import { Logger } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackupAgendador } from './backup.agendador.js'
import type { BackupService } from './backup.service.js'

const UM_MINUTO = 60 * 1000
const UMA_HORA = 60 * UM_MINUTO

const montar = (isTest = false) => {
  const executarSeNecessario = vi.fn(async () => undefined)
  const agendador = new BackupAgendador(
    { isTest } as never,
    {
      executarSeNecessario,
    } as unknown as BackupService,
  )
  return { agendador, executarSeNecessario }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('BackupAgendador', () => {
  it('confere 1 minuto depois de abrir e depois de hora em hora', async () => {
    const { agendador, executarSeNecessario } = montar()
    agendador.onApplicationBootstrap()

    await vi.advanceTimersByTimeAsync(UM_MINUTO - 1)
    expect(executarSeNecessario).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(executarSeNecessario).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3 * UMA_HORA)
    expect(executarSeNecessario).toHaveBeenCalledTimes(4)
    agendador.onApplicationShutdown()
  })

  it('backup que falha só vai para o registro: o app continua e tenta na próxima hora', async () => {
    const erro = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    const { agendador, executarSeNecessario } = montar()
    executarSeNecessario.mockRejectedValueOnce(new Error('disco cheio'))
    agendador.onApplicationBootstrap()

    await vi.advanceTimersByTimeAsync(UM_MINUTO)
    expect(erro).toHaveBeenCalledWith('Backup automático falhou: disco cheio')

    await vi.advanceTimersByTimeAsync(UMA_HORA)
    expect(executarSeNecessario).toHaveBeenCalledTimes(2)
    agendador.onApplicationShutdown()
  })

  it('ao fechar o app, para de agendar', async () => {
    const { agendador, executarSeNecessario } = montar()
    agendador.onApplicationBootstrap()
    agendador.onApplicationShutdown()
    await vi.advanceTimersByTimeAsync(2 * UMA_HORA)
    expect(executarSeNecessario).not.toHaveBeenCalled()
  })

  it('nos testes automatizados não agenda nada', async () => {
    const { agendador, executarSeNecessario } = montar(true)
    agendador.onApplicationBootstrap()
    await vi.advanceTimersByTimeAsync(2 * UMA_HORA)
    expect(executarSeNecessario).not.toHaveBeenCalled()
  })
})
