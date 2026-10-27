import 'reflect-metadata'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Simula uma falha ao abrir o banco (ex.: dados de uma versão mais nova do app).
vi.mock('../src/common/database/connection.js', async (original) => ({
  ...(await original<typeof import('../src/common/database/connection.js')>()),
  migrarSchema: () => {
    throw new Error('Estes dados foram gravados por uma versão mais nova do Brastem-Service.')
  },
}))

describe('falha ao iniciar (e2e)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devolve o erro para quem chamou, sem encerrar o processo (R-ATU-06)', async () => {
    // No app desktop o processo é o Electron: um process.exit fechava o app sem nenhum aviso, e ele
    // não chegava a mostrar a tela de erro com "Procurar atualização".
    const sair = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const { createApp } = await import('../src/bootstrap.js')

    await expect(createApp()).rejects.toThrow('versão mais nova')
    expect(sair).not.toHaveBeenCalled()
  })
})
