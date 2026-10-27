import { describe, expect, it } from 'vitest'
import { CAMPOS_OCULTOS_NO_LOG, requisicaoParaLog } from './logger.module.js'

describe('registro de pedidos (R-SEG-11)', () => {
  it('guarda só o caminho: o código do retorno do Google não vai para o log', () => {
    const req = requisicaoParaLog({
      method: 'GET',
      url: '/api/backup/google/callback?code=segredo-do-google&state=abc',
      query: { code: 'segredo-do-google', state: 'abc' },
    })
    expect(req).toMatchObject({ method: 'GET', url: '/api/backup/google/callback' })
    expect(JSON.stringify(req)).not.toContain('segredo-do-google')
  })

  it('esconde cookies e a senha enviada', () => {
    expect(CAMPOS_OCULTOS_NO_LOG).toEqual(
      expect.arrayContaining(['req.headers.cookie', 'res.headers["set-cookie"]', 'req.body.senha']),
    )
  })
})
