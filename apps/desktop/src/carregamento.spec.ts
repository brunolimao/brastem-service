import { describe, expect, it, vi } from 'vitest'
import { carregarComNovasTentativas } from './carregamento'

const semEspera = { dormir: async () => undefined }

describe('carregarComNovasTentativas', () => {
  it('carrega de primeira quando dá certo', async () => {
    const carregar = vi.fn(async () => undefined)
    expect(await carregarComNovasTentativas(carregar, 'http://127.0.0.1:47831', semEspera)).toBe(
      true,
    )
    expect(carregar).toHaveBeenCalledOnce()
  })

  it('tenta de novo quando o carregamento falha (ex.: serviço de rede reiniciando)', async () => {
    const carregar = vi
      .fn<(endereco: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error('ERR_FAILED (-2)'))
      .mockRejectedValueOnce(new Error('ERR_NETWORK_CHANGED (-21)'))
      .mockResolvedValueOnce(undefined)
    const registrar = vi.fn()

    const ok = await carregarComNovasTentativas(carregar, 'http://127.0.0.1:47831', {
      ...semEspera,
      registrar,
    })

    expect(ok).toBe(true)
    expect(carregar).toHaveBeenCalledTimes(3)
    expect(registrar).toHaveBeenCalledWith(expect.stringContaining('tentativa 1 de 6'))
  })

  it('desiste depois de todas as tentativas e avisa quem chamou (para mostrar a tela de erro)', async () => {
    const carregar = vi.fn(async () => {
      throw new Error('ERR_CONNECTION_REFUSED')
    })
    const dormir = vi.fn(async () => undefined)
    const ok = await carregarComNovasTentativas(carregar, 'x', { tentativas: 3, dormir })
    expect(ok).toBe(false)
    expect(carregar).toHaveBeenCalledTimes(3)
    expect(dormir).toHaveBeenCalledTimes(2)
  })

  it('espera cada vez mais entre as tentativas, até 5 segundos', async () => {
    const esperas: number[] = []
    await carregarComNovasTentativas(
      async () => {
        throw new Error('falhou')
      },
      'x',
      {
        dormir: async (ms) => {
          esperas.push(ms)
        },
      },
    )
    expect(esperas).toEqual([500, 1000, 2000, 4000, 5000])
  })
})
