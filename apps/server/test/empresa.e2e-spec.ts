import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

describe('dados da empresa (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    await request(app.getHttpServer()).post('/api/auth/setup').send(credenciais).expect(201)
    admin = request.agent(app.getHttpServer())
    await admin.post('/api/auth/login').send(credenciais).expect(200)
  })

  afterAll(async () => {
    await app.close()
  })

  it('exige login', async () => {
    await request(app.getHttpServer()).get('/api/empresa').expect(401)
  })

  it('começa vazia: nenhum dado da empresa vem de fábrica', async () => {
    const res = await admin.get('/api/empresa').expect(200)
    expect(res.body).toEqual({ nome: '', cnpj: '', telefone: '', endereco: '', cep: '' })
  })

  it('o administrador salva e qualquer usuário logado lê (para imprimir a OS)', async () => {
    const salvo = await admin
      .put('/api/empresa')
      .send({
        nome: ' Assistência Exemplo ',
        cnpj: '12.345.678/0001-99',
        telefone: '(11) 4000-0000',
      })
      .expect(200)
    expect(salvo.body).toMatchObject({ nome: 'Assistência Exemplo', cnpj: '12.345.678/0001-99' })

    await admin
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'outra-senha-1', role: 'usuario' })
      .expect(201)
    const maria = request.agent(app.getHttpServer())
    await maria
      .post('/api/auth/login')
      .send({ usuario: 'maria', senha: 'outra-senha-1' })
      .expect(200)

    expect((await maria.get('/api/empresa').expect(200)).body.nome).toBe('Assistência Exemplo')
    await maria.put('/api/empresa').send({ nome: 'Invasora' }).expect(403)
  })

  it('salvar de novo substitui (campos não enviados voltam a ficar vazios)', async () => {
    const res = await admin.put('/api/empresa').send({ nome: 'Só o nome' }).expect(200)
    expect(res.body).toEqual({ nome: 'Só o nome', cnpj: '', telefone: '', endereco: '', cep: '' })
  })

  it('valida o tamanho dos campos', async () => {
    const res = await admin
      .put('/api/empresa')
      .send({ nome: 'x'.repeat(200) })
      .expect(400)
    expect(res.body.message).toContain('O campo "nome" deve ter no máximo 120 caracteres')
  })
})
