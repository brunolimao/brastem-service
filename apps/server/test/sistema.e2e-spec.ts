import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** Botão "Procurar atualização" do menu (R-ATU-11). */
describe('procurar atualização pela tela (e2e)', () => {
  let app: INestApplication
  let logado: ReturnType<typeof request.agent>

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }
    await request(app.getHttpServer()).post('/api/auth/setup').send(credenciais).expect(201)
    logado = request.agent(app.getHttpServer())
    await logado.post('/api/auth/login').send(credenciais).expect(200)
  })

  afterAll(async () => {
    await app.close()
  })

  it('avisa o app desktop, que procura e responde numa janela', async () => {
    const escuta = vi.fn()
    process.on('brastem:procurar-atualizacao', escuta)
    try {
      const resposta = await logado.post('/api/sistema/procurar-atualizacao').expect(202)
      expect(resposta.body).toEqual({ iniciado: true })
      expect(escuta).toHaveBeenCalledOnce()
    } finally {
      process.off('brastem:procurar-atualizacao', escuta)
    }
  })

  it('fora do app desktop ninguém escuta: responde que não iniciou', async () => {
    const resposta = await logado.post('/api/sistema/procurar-atualizacao').expect(202)
    expect(resposta.body).toEqual({ iniciado: false })
  })

  it('só para quem está logado', async () => {
    await request(app.getHttpServer()).post('/api/sistema/procurar-atualizacao').expect(401)
  })
})
