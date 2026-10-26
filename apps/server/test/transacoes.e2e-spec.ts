import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** Receitas e despesas avulsas: listagem, exclusão e permissões (docs/especificacao/modulos/receitas-e-despesas.md). */
describe('receitas e despesas (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  let comum: ReturnType<typeof request.agent>

  const lancar = async (dados: Record<string, unknown>, quem = admin) =>
    (
      await quem
        .post('/api/transacoes')
        .send({
          tipo: 'receita',
          categoria: 'venda',
          descricao: 'Venda de peça',
          data: '2026-09-10',
          valor: 10000,
          ...dados,
        })
        .expect(201)
    ).body as { id: number }

  const caixa = async (inicio: string, fim: string) =>
    (await admin.get('/api/caixa').query({ inicio, fim }).expect(200)).body as {
      total: number
      quantidade: number
    }

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    const servidor = app.getHttpServer()
    await request(servidor)
      .post('/api/auth/setup')
      .send({ usuario: 'admin', senha: 'senha-segura-1' })
      .expect(201)
    admin = request.agent(servidor)
    await admin
      .post('/api/auth/login')
      .send({ usuario: 'admin', senha: 'senha-segura-1' })
      .expect(200)
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'balcao', senha: 'senha-segura-2', role: 'usuario' })
      .expect(201)
    comum = request.agent(servidor)
    await comum
      .post('/api/auth/login')
      .send({ usuario: 'balcao', senha: 'senha-segura-2' })
      .expect(200)

    // Setembro: duas receitas e uma despesa. Outubro: uma receita (fora dos filtros de setembro).
    await lancar({ data: '2026-09-01', descricao: 'Primeiro dia' })
    await lancar({ data: '2026-09-30', descricao: 'Último dia' })
    await lancar({ tipo: 'despesa', categoria: 'transporte', descricao: 'Gasolina', valor: 3000 })
    await lancar({ data: '2026-10-05', descricao: 'Outubro' })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('listar', () => {
    it('período inclui o primeiro e o último dia; mais recentes primeiro', async () => {
      const resposta = await admin
        .get('/api/transacoes')
        .query({ inicio: '2026-09-01', fim: '2026-09-30' })
        .expect(200)
      expect(resposta.body.total).toBe(3)
      expect(resposta.body.items.map((t: { descricao: string }) => t.descricao)).toEqual([
        'Último dia',
        'Gasolina',
        'Primeiro dia',
      ])
    })

    it('filtra por tipo', async () => {
      const resposta = await admin.get('/api/transacoes').query({ tipo: 'despesa' }).expect(200)
      expect(resposta.body.items).toEqual([
        expect.objectContaining({ descricao: 'Gasolina', tipo: 'despesa', valor: 3000 }),
      ])
    })

    it('pagina: total de tudo, itens só da página', async () => {
      const resposta = await admin
        .get('/api/transacoes')
        .query({ page: 2, pageSize: 3 })
        .expect(200)
      expect(resposta.body).toMatchObject({ total: 4, page: 2, pageSize: 3 })
      expect(resposta.body.items).toHaveLength(1)
    })

    it('tipo desconhecido é recusado com mensagem em português', async () => {
      const resposta = await admin.get('/api/transacoes').query({ tipo: 'outro' }).expect(400)
      expect(resposta.body.message).toEqual(['O campo "tipo" possui um valor inválido'])
    })
  })

  describe('validação ao lançar', () => {
    it('explica cada campo errado em português', async () => {
      const resposta = await admin
        .post('/api/transacoes')
        .send({
          tipo: 'receita',
          categoria: 'venda',
          descricao: '',
          data: '2026-02-30',
          valor: 'cem',
          pagamentos: 'à vista',
          extra: 1,
        })
        .expect(400)
      expect(resposta.body.message).toEqual(
        expect.arrayContaining([
          'O campo "extra" não é permitido',
          'O campo "descricao" é obrigatório',
          'O campo "data" deve ser uma data válida',
          'O campo "valor" deve ser um número inteiro',
          'O campo "pagamentos" deve ser uma lista',
        ]),
      )
    })

    it('categoria de despesa numa receita é recusada (R-TRA-03)', async () => {
      const resposta = await admin
        .post('/api/transacoes')
        .send({
          tipo: 'receita',
          categoria: 'transporte',
          descricao: 'x',
          data: '2026-09-10',
          valor: 100,
        })
        .expect(400)
      expect(resposta.body.message).toBe('Categoria inválida para receita')
    })
  })

  describe('excluir (R-TRA-05)', () => {
    it('apaga o lançamento com os pagamentos e as parcelas: o caixa deixa de contar', async () => {
      const antes = await caixa('2026-11-01', '2027-03-31')
      const { id } = await lancar({
        data: '2026-11-10',
        valor: 30000,
        pagamentos: [{ valor: 30000, tipo: 'credito', parcelas: 3, data: '2026-11-10' }],
      })
      const comLancamento = await caixa('2026-11-01', '2027-03-31')
      expect(comLancamento.total - antes.total).toBe(30000)

      const pagamentos = await admin
        .get('/api/pagamentos')
        .query({ inicio: '2026-11-10', fim: '2026-11-10' })
        .expect(200)
      const pagamentoId = pagamentos.body.items[0].id as number
      expect((await admin.get(`/api/pagamentos/${pagamentoId}/parcelas`)).body).toHaveLength(3)

      await admin.delete(`/api/transacoes/${id}`).expect(204)

      expect(await caixa('2026-11-01', '2027-03-31')).toMatchObject({
        total: antes.total,
        quantidade: antes.quantidade,
      })
      const parcelas = await admin.get(`/api/pagamentos/${pagamentoId}/parcelas`)
      expect(parcelas.status === 404 || parcelas.body.length === 0).toBe(true)
    })

    it('excluir de novo (ou um código que não existe) responde 404', async () => {
      const { id } = await lancar({})
      await admin.delete(`/api/transacoes/${id}`).expect(204)
      const resposta = await admin.delete(`/api/transacoes/${id}`).expect(404)
      expect(resposta.body.message).toBe('Transação não encontrada')
    })
  })

  describe('permissões', () => {
    it('usuário comum lança receita e despesa', async () => {
      await lancar({ descricao: 'Lançado no balcão' }, comum)
    })

    it('usuário comum não lista nem exclui (só administrador)', async () => {
      await comum.get('/api/transacoes').expect(403)
      const { id } = await lancar({})
      await comum.delete(`/api/transacoes/${id}`).expect(403)
      await admin.delete(`/api/transacoes/${id}`).expect(204)
    })
  })
})
