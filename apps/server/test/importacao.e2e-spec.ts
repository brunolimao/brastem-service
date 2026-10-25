import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'
import { dumpExemplo } from '../src/legacy/dump-exemplo.js'

describe('importação do sistema antigo (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const importar = (corpo: string | Buffer) =>
    request(app.getHttpServer())
      .post('/api/import/legacy')
      .set('content-type', 'application/octet-stream')
      .send(corpo)

  it('recusa arquivos que não são o dump do sistema antigo', async () => {
    const naoEhSql = await importar('isto não é um dump').expect(400)
    expect(naoEhSql.body.message).toBe('Este arquivo não parece um dump do MySQL (.sql).')

    const semDados = await importar('CREATE TABLE `Outra` (\n  `id` int\n) ENGINE=InnoDB;').expect(
      400,
    )
    expect(semDados.body.message).toBe('Não encontrei os dados do sistema antigo neste arquivo.')
  })

  it('importa antes do primeiro uso e as senhas antigas continuam valendo', async () => {
    expect((await request(app.getHttpServer()).get('/api/auth/setup')).body).toEqual({
      needsSetup: true,
    })

    const res = await importar(Buffer.from(dumpExemplo, 'utf8')).expect(201)
    expect(res.body.tabelas.clientes).toMatchObject({ lidos: 3, importados: 3 })
    expect(res.body.totais).toEqual({ ordensServico: 35000, pagamentos: 36000, parcelas: 36000 })

    expect((await request(app.getHttpServer()).get('/api/auth/setup')).body).toEqual({
      needsSetup: false,
    })

    const agent = request.agent(app.getHttpServer())
    await agent.post('/api/auth/login').send({ usuario: 'admin', senha: '123456' }).expect(200)
    const clientes = await agent.get('/api/clientes').expect(200)
    expect(clientes.body.total).toBe(3)
  })

  it('não deixa importar de novo depois que o sistema já tem usuários', async () => {
    const res = await importar(Buffer.from(dumpExemplo, 'utf8')).expect(403)
    expect(res.body.message).toBe(
      'A importação só pode ser feita no primeiro uso, antes de criar usuários.',
    )
  })
})
