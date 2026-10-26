import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** R-ACE-03 / R-SEG-07: no máximo 5 tentativas de login por minuto. */
describe('limite de tentativas de login (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .send({ usuario: 'admin', senha: 'senha-segura-1' })
      .expect(201)
  })

  afterAll(async () => {
    await app.close()
  })

  it('a partir da 6ª tentativa no mesmo minuto, recusa com 429 e mensagem em português', async () => {
    const tentar = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'admin', senha: 'senha-errada-1' })

    for (let i = 0; i < 5; i++) await tentar().expect(401)
    const bloqueada = await tentar().expect(429)
    expect(bloqueada.body.message).toMatch(/tentativas|aguarde|muitas/i)
  })
})
