import 'reflect-metadata'
import { mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import { strFromU8, unzipSync } from 'fflate'
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

/** Botão "Gerar diagnóstico" de Configurações (R-CFG-10). */
describe('diagnóstico para o suporte (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  let comum: ReturnType<typeof request.agent>
  const pastaDeLogs = join(tmpdir(), 'brastem-testes', 'logs')

  const baixar = async () => {
    const resposta = await admin
      .get('/api/sistema/diagnostico')
      .buffer(true)
      .parse((res, pronto) => {
        const partes: Buffer[] = []
        res.on('data', (parte: Buffer) => partes.push(parte))
        res.on('end', () => pronto(null, Buffer.concat(partes)))
      })
      .expect(200)
    return { resposta, arquivos: unzipSync(new Uint8Array(resposta.body as Buffer)) }
  }

  beforeAll(async () => {
    // Quatro dias de registros: vão só os 3 mais recentes.
    rmSync(pastaDeLogs, { recursive: true, force: true })
    mkdirSync(pastaDeLogs, { recursive: true })
    for (const [dia, segundos] of [
      ['2026-10-24', 1],
      ['2026-10-25', 2],
      ['2026-10-26', 3],
      ['2026-10-27', 4],
    ] as const) {
      const arquivo = join(pastaDeLogs, `brastem.${dia}.log`)
      writeFileSync(arquivo, `registro de ${dia}\n`)
      utimesSync(arquivo, segundos, segundos)
    }

    app = await createApp()
    await app.init()
    const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }
    await request(app.getHttpServer()).post('/api/auth/setup').send(credenciais).expect(201)
    admin = request.agent(app.getHttpServer())
    await admin.post('/api/auth/login').send(credenciais).expect(200)
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'senha-segura-2', role: 'usuario' })
      .expect(201)
    await admin
      .post('/api/clientes')
      .send({ nome: 'Cliente Sigiloso', cpf: '12345678901' })
      .expect(201)
    comum = request.agent(app.getHttpServer())
    await comum
      .post('/api/auth/login')
      .send({ usuario: 'maria', senha: 'senha-segura-2' })
      .expect(200)
  })

  afterAll(async () => {
    await app.close()
    rmSync(pastaDeLogs, { recursive: true, force: true })
  })

  it('baixa um .zip com versões, banco, backup e os 3 registros mais recentes', async () => {
    const { resposta, arquivos } = await baixar()
    expect(resposta.headers['content-type']).toBe('application/zip')
    expect(resposta.headers['content-disposition']).toMatch(
      /^attachment; filename="diagnostico-brastem-\d{4}-\d{2}-\d{2}\.zip"$/,
    )
    expect(Object.keys(arquivos).sort()).toEqual([
      'diagnostico.json',
      'logs/brastem.2026-10-25.log',
      'logs/brastem.2026-10-26.log',
      'logs/brastem.2026-10-27.log',
    ])
    const resumo = JSON.parse(strFromU8(arquivos['diagnostico.json'] as Uint8Array))
    expect(resumo).toMatchObject({
      versao: 'desenvolvimento',
      ambiente: { node: process.versions.node },
      banco: { pendentes: 0, quantidades: { clientes: 1, usuarios: 2, ordens_servico: 0 } },
      backup: { google: { conectado: false } },
    })
  })

  it('não leva dados de clientes nem o e-mail do Google', async () => {
    const { arquivos } = await baixar()
    const texto = strFromU8(arquivos['diagnostico.json'] as Uint8Array)
    expect(texto).not.toContain('Cliente Sigiloso')
    expect(texto).not.toContain('12345678901')
    expect(texto).not.toContain('email')
  })

  it('só o administrador gera', async () => {
    await comum.get('/api/sistema/diagnostico').expect(403)
    await request(app.getHttpServer()).get('/api/sistema/diagnostico').expect(401)
  })
})
