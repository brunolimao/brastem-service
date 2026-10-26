import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** Regras de busca, OS, validação e concorrência (correções da revisão de 26/10/2026). */
describe('regras de negócio (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  let clienteId = 0
  let aparelhoId = 0

  const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }

  const criarOs = async (dados: Record<string, unknown>) =>
    (
      await admin
        .post('/api/ordens-servico')
        .send({
          clienteId,
          aparelhoId,
          status: 'ABERTO',
          valor: 10000,
          abertura: '2026-10-01',
          ...dados,
        })
        .expect(201)
    ).body.ordemServico as { id: number }

  const garantiaDoAparelho = async () =>
    (await admin.get(`/api/clientes/${clienteId}`).expect(200)).body.aparelhos[0].garantiaAte

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    // Dois primeiros acessos ao mesmo tempo: só um pode criar o admin (antes passavam os dois).
    const tentativas = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/setup').send(credenciais),
      request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({ usuario: 'intruso', senha: 'outra-senha-1' }),
    ])
    expect(tentativas.map((r) => r.status).sort()).toEqual([201, 403])
    const vencedor = tentativas.find((r) => r.status === 201)
    expect(vencedor).toBeDefined()

    admin = request.agent(app.getHttpServer())
    const login = await admin.post('/api/auth/login').send(credenciais)
    if (login.status !== 200) {
      // Quem ganhou a corrida foi o "intruso": o teste segue com ele (também é admin).
      await admin
        .post('/api/auth/login')
        .send({ usuario: 'intruso', senha: 'outra-senha-1' })
        .expect(200)
    }

    const cliente = await admin
      .post('/api/clientes')
      .send({ nome: 'Maria', aparelhos: [{ nome: 'Geladeira' }] })
      .expect(201)
    clienteId = cliente.body.id
    aparelhoId = cliente.body.aparelhos[0].id
  })

  afterAll(async () => {
    await app.close()
  })

  it('usuários duplicados criados ao mesmo tempo: um 201 e um 409 (nunca 500)', async () => {
    const dados = { usuario: 'joana', senha: 'senha-segura-2', role: 'usuario' }
    const respostas = await Promise.all([
      admin.post('/api/usuarios').send(dados),
      admin.post('/api/usuarios').send(dados),
    ])
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409])
  })

  describe('busca de OS', () => {
    it('"Todos" (sem campo) procura em todos os campos em vez de devolver tudo', async () => {
      await criarOs({
        status: 'FECHADO',
        fechamento: '2026-10-02',
        solucionado: 'Troca do termostato',
      })
      await criarOs({ abertura: '2026-09-15', valor: 125000 })

      const porTexto = await admin.get('/api/ordens-servico').query({ busca: 'termostato' })
      expect(porTexto.body.total).toBe(1)

      const porValor = await admin.get('/api/ordens-servico').query({ busca: '1.250' })
      expect(porValor.body.total).toBe(1)

      const nada = await admin.get('/api/ordens-servico').query({ busca: 'nada disso' })
      expect(nada.body.total).toBe(0)
    })

    it('abertura aceita dd/MM/yyyy e MM/yyyy', async () => {
      const dia = await admin
        .get('/api/ordens-servico')
        .query({ busca: '15/09/2026', campo: 'abertura' })
      expect(dia.body.total).toBe(1)
      const mes = await admin
        .get('/api/ordens-servico')
        .query({ busca: '10/2026', campo: 'abertura' })
      expect(mes.body.total).toBeGreaterThanOrEqual(1)
      expect(
        mes.body.items.every((os: { abertura: string }) => os.abertura.startsWith('2026-10')),
      ).toBe(true)
    })
  })

  describe('garantia e reabertura da OS', () => {
    it('a garantia do aparelho é a mais longa entre as OS, e editar uma OS antiga não a encurta', async () => {
      const antiga = await criarOs({
        status: 'FECHADO',
        fechamento: '2026-01-10',
        garantiaDias: 30,
      })
      await criarOs({ status: 'FECHADO', fechamento: '2026-06-01', garantiaDias: 90 })
      expect(await garantiaDoAparelho()).toBe('2026-08-30')

      await admin.patch(`/api/ordens-servico/${antiga.id}`).send({ garantiaDias: 60 }).expect(200)
      expect(await garantiaDoAparelho()).toBe('2026-08-30')
    })

    it('null limpa a garantia; reabrir limpa fechamento, solução e garantia', async () => {
      const os = await criarOs({
        status: 'FECHADO',
        fechamento: '2026-10-20',
        garantiaDias: 365,
        solucionado: 'Troca do compressor',
      })
      expect(await garantiaDoAparelho()).toBe('2027-10-20')

      const semGarantia = await admin
        .patch(`/api/ordens-servico/${os.id}`)
        .send({ garantiaDias: null })
        .expect(200)
      expect(semGarantia.body.ordemServico.garantiaDias).toBeNull()
      expect(await garantiaDoAparelho()).toBe('2026-08-30')

      const reaberta = await admin
        .patch(`/api/ordens-servico/${os.id}`)
        .send({ status: 'ABERTO', fechamento: null })
        .expect(200)
      expect(reaberta.body.ordemServico).toMatchObject({
        status: 'ABERTO',
        fechamento: null,
        garantiaDias: null,
        solucionado: '',
      })
    })

    it('não deixa uma OS fechada sem data de fechamento', async () => {
      const os = await criarOs({ status: 'FECHADO', fechamento: '2026-10-20' })
      const res = await admin
        .patch(`/api/ordens-servico/${os.id}`)
        .send({ fechamento: null })
        .expect(400)
      expect(res.body.message).toContain('data de fechamento')
    })

    it('excluir a OS recalcula a garantia do aparelho', async () => {
      const os = await criarOs({ status: 'FECHADO', fechamento: '2027-01-01', garantiaDias: 365 })
      expect(await garantiaDoAparelho()).toBe('2028-01-01')
      await admin.delete(`/api/ordens-servico/${os.id}`).expect(204)
      expect(await garantiaDoAparelho()).toBe('2026-08-30')
    })
  })

  describe('validação devolve 400, nunca 500', () => {
    it('null em campo obrigatório', async () => {
      const os = await criarOs({})
      const res = await admin
        .patch(`/api/ordens-servico/${os.id}`)
        .send({ valor: null })
        .expect(400)
      expect(res.body.message.join(' ')).toContain('valor')
      await admin.patch(`/api/clientes/${clienteId}`).send({ cidade: null }).expect(400)
    })

    it('data que não existe no calendário', async () => {
      const res = await admin
        .post('/api/ordens-servico')
        .send({ clienteId, aparelhoId, valor: 0, abertura: '2026-02-30', status: 'ABERTO' })
        .expect(400)
      expect(res.body.message.join(' ')).toContain('data válida')
    })
  })

  it('transação: a soma dos pagamentos precisa fechar com o valor', async () => {
    const base = {
      tipo: 'receita',
      categoria: 'venda',
      data: '2026-10-26',
      descricao: 'Venda de peça',
      valor: 10000,
    }
    const res = await admin
      .post('/api/transacoes')
      .send({ ...base, pagamentos: [{ valor: 5000, tipo: 'pix', data: '2026-10-26' }] })
      .expect(400)
    expect(res.body.message).toContain('soma dos pagamentos')

    await admin
      .post('/api/transacoes')
      .send({
        ...base,
        pagamentos: [
          { valor: 5000, tipo: 'pix', data: '2026-10-26' },
          { valor: 5000, tipo: 'dinheiro', data: '2026-10-26' },
        ],
      })
      .expect(201)
  })

  it('a data de cadastro do cliente pode ser corrigida (como no sistema antigo)', async () => {
    const res = await admin
      .patch(`/api/clientes/${clienteId}`)
      .send({ dataCadastro: '2024-02-14' })
      .expect(200)
    // Meio-dia UTC: continua sendo 14/02 em Brasília (e no relatório de clientes novos).
    expect(res.body.criadoEm).toBe('2024-02-14T12:00:00.000Z')
    await admin.patch(`/api/clientes/${clienteId}`).send({ dataCadastro: '2024-02-30' }).expect(400)
  })

  it('caixa e usuários vêm paginados; o total do caixa vale para o período inteiro', async () => {
    for (let dia = 1; dia <= 25; dia++) {
      await admin
        .post('/api/transacoes')
        .send({
          tipo: 'receita',
          categoria: 'venda',
          data: `2030-01-${String(dia).padStart(2, '0')}`,
          descricao: `Venda ${dia}`,
          valor: 100,
        })
        .expect(201)
    }
    const pagina = (
      await admin
        .get('/api/caixa')
        .query({ inicio: '2030-01-01', fim: '2030-01-31', page: 3, pageSize: 10 })
        .expect(200)
    ).body
    expect(pagina.itens).toHaveLength(5)
    expect(pagina.itens[0].data).toBe('2030-01-21')
    expect(pagina).toMatchObject({ quantidade: 25, total: 2500, page: 3, pageSize: 10 })
    expect(pagina.formas.dinheiro).toBe(25)

    const usuarios = (await admin.get('/api/usuarios').query({ pageSize: 1 }).expect(200)).body
    expect(usuarios.items).toHaveLength(1)
    expect(usuarios.total).toBeGreaterThan(1)
  })

  it('busca de pagamentos em "Todos" filtra pelo texto', async () => {
    const todos = await admin.get('/api/pagamentos').expect(200)
    const pix = await admin.get('/api/pagamentos').query({ busca: 'pix' }).expect(200)
    expect(pix.body.total).toBeGreaterThan(0)
    expect(pix.body.total).toBeLessThan(todos.body.total)
  })
})
