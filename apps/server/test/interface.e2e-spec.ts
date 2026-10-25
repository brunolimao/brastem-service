import 'reflect-metadata'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('servidor entregando a interface (app desktop)', () => {
  let app: INestApplication
  // Pasta com ponto no caminho (como .stage do app desktop): o Express a trataria como oculta sem o `root`.
  const base = mkdtempSync(join(tmpdir(), 'brastem-client-'))
  const pasta = join(base, '.stage', 'client')

  beforeAll(async () => {
    mkdirSync(join(pasta, 'assets'), { recursive: true })
    writeFileSync(join(pasta, 'index.html'), '<!doctype html><title>Brastem</title>')
    writeFileSync(join(pasta, 'assets', 'app.js'), 'console.log(1)')
    process.env.CLIENT_DIR = pasta

    const { createApp } = await import('../src/bootstrap.js')
    app = await createApp()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    rmSync(base, { recursive: true, force: true })
    Reflect.deleteProperty(process.env, 'CLIENT_DIR')
  })

  const http = () => request(app.getHttpServer())

  it('entrega o index.html na raiz e nas rotas do front', async () => {
    expect((await http().get('/').expect(200)).text).toContain('<title>Brastem</title>')
    expect((await http().get('/clientes/3').expect(200)).text).toContain('<title>Brastem</title>')
  })

  it('entrega os arquivos do front e dá 404 para arquivo que não existe', async () => {
    await http().get('/assets/app.js').expect(200)
    await http().get('/assets/sumiu.js').expect(404)
  })

  it('não confunde a API com o front', async () => {
    const res = await http().get('/api/clientes').expect(401)
    expect(res.body.message).toBe('Favor fazer o login!')
  })
})
