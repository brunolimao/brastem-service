import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

describe('auth e usuários (e2e)', () => {
  let app: INestApplication
  const admin = { usuario: 'admin', senha: 'senha-segura-1' }

  beforeAll(async () => {
    app = await createApp()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const http = () => request(app.getHttpServer())

  it('exige login nas rotas protegidas (R-PERM-01)', async () => {
    const res = await http().get('/api/usuarios').expect(401)
    expect(res.body.message).toBe('Favor fazer o login!')
  })

  it('informa que precisa de configuração inicial e cria o primeiro admin uma única vez (R-ACE-01)', async () => {
    expect((await http().get('/api/auth/setup')).body).toEqual({ needsSetup: true })
    await http().post('/api/auth/setup').send(admin).expect(201)
    expect((await http().get('/api/auth/setup')).body).toEqual({ needsSetup: false })
    await http().post('/api/auth/setup').send(admin).expect(403)
  })

  it('rejeita credenciais inválidas com 401 (R-ACE-02)', async () => {
    const res = await http()
      .post('/api/auth/login')
      .send({ usuario: 'admin', senha: 'errada' })
      .expect(401)
    expect(res.body.message).toBe('Usuário ou senha inválidos')
  })

  it('valida o corpo com mensagens em pt-BR', async () => {
    const res = await http()
      .post('/api/auth/setup')
      .send({ usuario: 'a', senha: '123' })
      .expect(400)
    expect(res.body.message).toContain('O campo "senha" deve ter no mínimo 8 caracteres')
  })

  it('faz login com cookies httpOnly, renova e sai (R-ACE-04, R-SEG-05)', async () => {
    const agent = request.agent(app.getHttpServer())

    const login = await agent.post('/api/auth/login').send(admin).expect(200)
    const cookies = login.headers['set-cookie'] as unknown as string[]
    expect(cookies.every((c) => c.includes('HttpOnly') && c.includes('SameSite=Strict'))).toBe(true)
    expect(login.body).toMatchObject({ usuario: 'admin', role: 'admin' })

    await agent.get('/api/auth/me').expect(200)
    await agent.post('/api/auth/refresh').expect(200)
    await agent.get('/api/usuarios').expect(200)

    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/auth/me').expect(401)
  })

  it('reapresentar um refresh token já usado derruba as sessões (R-SEG-05)', async () => {
    const agent = request.agent(app.getHttpServer())
    const login = await agent.post('/api/auth/login').send(admin)
    const old = (login.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('refresh_token='),
    )
    expect(old).toBeDefined()
    const oldValue = (old as string).split(';')[0] as string

    await agent.post('/api/auth/refresh').expect(200)
    await http().post('/api/auth/refresh').set('Cookie', oldValue).expect(401)
    await agent.post('/api/auth/refresh').expect(401)
  })

  it('só admin gerencia usuários e ninguém apaga a si mesmo (R-PERM-04, R-USU-02)', async () => {
    const agent = request.agent(app.getHttpServer())
    const me = (await agent.post('/api/auth/login').send(admin)).body as { id: number }

    await agent
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'outra-senha-1', role: 'usuario' })
      .expect(201)
    const dup = await agent
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'outra-senha-1', role: 'usuario' })
      .expect(409)
    expect(dup.body.message).toBe('Já existe alguém com esse usuário!')

    const self = await agent.delete(`/api/usuarios/${me.id}`).expect(403)
    expect(self.body.message).toBe('Não pode apagar você mesmo!')

    const maria = request.agent(app.getHttpServer())
    await maria
      .post('/api/auth/login')
      .send({ usuario: 'maria', senha: 'outra-senha-1' })
      .expect(200)
    const forbidden = await maria.get('/api/usuarios').expect(403)
    expect(forbidden.body.message).toBe('Apenas administradores podem fazer isso')
  })
})
