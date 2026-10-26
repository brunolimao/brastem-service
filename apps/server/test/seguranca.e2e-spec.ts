import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/**
 * O servidor escuta em 127.0.0.1, mas um site aberto no navegador consegue mandar pedidos para lá.
 * Estes testes simulam o que um site malicioso conseguiria fazer.
 */
describe('acesso só pelo próprio computador (e2e)', () => {
  let app: INestApplication
  const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }

  beforeAll(async () => {
    app = await createApp()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('a versão do sistema é pública (aparece no menu e serve para o suporte)', async () => {
    const res = await request(app.getHttpServer()).get('/api/sistema').expect(200)
    // Fora do app desktop o Electron não informa a versão.
    expect(res.body).toEqual({ versao: 'desenvolvimento' })
  })

  it('DNS rebinding: Host que não é o computador local é recusado', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .set('Host', 'site-malicioso.com:47831')
      .send(credenciais)
      .expect(403)
  })

  it('pedido de outra origem (site aberto no navegador) é recusado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/setup')
      .set('Origin', 'https://site-malicioso.com')
      .send(credenciais)
      .expect(403)
    expect(res.body.message).toBe('Origem não permitida')
    // Página sem origem (arquivo aberto do disco) também.
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Origin', 'null')
      .send(credenciais)
      .expect(403)
  })

  it('formulário HTML (urlencoded) não cria o admin: a API só aceita JSON', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .type('form')
      .send(credenciais)
      .expect(400)
  })

  it('importação só aceita o arquivo como application/octet-stream', async () => {
    await request(app.getHttpServer())
      .post('/api/import/legacy')
      .set('Content-Type', 'text/plain')
      .send('CREATE TABLE `Clientes` (')
      .expect(400)
  })

  it('o próprio app (origem local) funciona normalmente', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .set('Origin', 'http://127.0.0.1:47831')
      .send(credenciais)
      .expect(201)
  })

  it('depois do primeiro usuário, a importação é recusada antes de receber o arquivo', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/import/legacy')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from('qualquer coisa'))
      .expect(403)
    expect(res.body.message).toContain('primeiro uso')
  })

  it('usuário excluído perde o acesso na hora (não espera o token vencer)', async () => {
    const admin = request.agent(app.getHttpServer())
    await admin.post('/api/auth/login').send(credenciais).expect(200)
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'temporario', senha: 'senha-segura-3', role: 'admin' })
      .expect(201)

    const temporario = request.agent(app.getHttpServer())
    await temporario
      .post('/api/auth/login')
      .send({ usuario: 'temporario', senha: 'senha-segura-3' })
      .expect(200)
    await temporario.get('/api/usuarios').expect(200)

    const lista = (await admin.get('/api/usuarios').expect(200)).body.items as {
      id: number
      usuario: string
    }[]
    const id = lista.find((u) => u.usuario === 'temporario')?.id
    await admin.delete(`/api/usuarios/${id}`).expect(204)

    await temporario.get('/api/usuarios').expect(401)
  })
})
