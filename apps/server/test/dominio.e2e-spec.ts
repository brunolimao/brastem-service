import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { addDays, format } from 'date-fns'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

describe('domínio (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  let clienteId = 0
  let aparelhoId = 0
  let osId = 0

  const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }
  // Clientes criados agora: de ontem a amanhã, para o teste não falhar se rodar perto da meia-noite.
  const ontem = format(addDays(new Date(), -1), 'yyyy-MM-dd')
  const amanha = format(addDays(new Date(), 1), 'yyyy-MM-dd')

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

  it('cadastra cliente com telefones e aparelhos e busca por telefone', async () => {
    const res = await admin
      .post('/api/clientes')
      .send({
        nome: 'João da Silva',
        cidade: 'Belo Horizonte',
        bairro: 'Centro',
        recomendacao: 'internet',
        telefones: [{ nome: 'Casa', telefone: '(31) 99999-1111' }],
        aparelhos: [{ nome: 'Geladeira', marca: 'Brastemp' }, { nome: 'Lava-louças' }],
      })
      .expect(201)

    clienteId = res.body.id
    aparelhoId = res.body.aparelhos[0].id
    expect(res.body.aparelhos.map((a: { ordem: number }) => a.ordem)).toEqual([1, 2])

    const busca = await admin
      .get('/api/clientes')
      .query({ busca: '99999-1111', campo: 'telefone' })
      .expect(200)
    expect(busca.body.total).toBe(1)
    expect(busca.body.items[0].nome).toBe('João da Silva')
  })

  it('só aceita campos de busca permitidos', async () => {
    const res = await admin.get('/api/clientes').query({ busca: 'x', campo: 'senha' }).expect(400)
    expect(res.body.message).toContain('O campo "campo" possui um valor inválido')
  })

  it('edita a lista de telefones: atualiza, cria e remove', async () => {
    const atual = (await admin.get(`/api/clientes/${clienteId}`).expect(200)).body
    const res = await admin
      .patch(`/api/clientes/${clienteId}`)
      .send({
        telefones: [
          { id: atual.telefones[0].id, telefone: '(31) 98888-2222', nome: 'Celular' },
          { telefone: '(31) 3333-4444' },
        ],
      })
      .expect(200)
    expect(res.body.telefones).toHaveLength(2)
    expect(res.body.telefones[0].telefone).toBe('(31) 98888-2222')
    expect(res.body.aparelhos).toHaveLength(2)
  })

  it('gera OS fechada com pagamentos parcelados e estende a garantia do aparelho', async () => {
    const res = await admin
      .post('/api/ordens-servico')
      .send({
        clienteId,
        aparelhoId,
        status: 'FECHADO',
        valor: 30000,
        taxaDeslocamento: 5000,
        relatado: 'Não gela',
        identificado: 'Compressor',
        garantiaDias: 90,
        abertura: '2026-09-30',
        fechamento: '2026-10-01',
        pagamentos: [
          { valor: 30000, tipo: 'credito', parcelas: 3, data: '2026-10-01' },
          { valor: 5000, tipo: 'pix', parcelas: 0, data: '2026-10-01' },
        ],
      })
      .expect(201)

    osId = res.body.ordemServico.id
    const [credito, pix] = res.body.pagamentos
    expect(credito.parcelasLista.map((p: { valor: number }) => p.valor)).toEqual([
      10000, 10000, 10000,
    ])
    expect(credito.parcelasLista.map((p: { data: string }) => p.data)).toEqual([
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
    ])
    expect(pix.parcelasLista).toHaveLength(1)

    const cliente = (await admin.get(`/api/clientes/${clienteId}`)).body
    expect(cliente.aparelhos[0].garantiaAte).toBe('2026-12-30')
  })

  it('valida regras da OS', async () => {
    const semFechamento = await admin
      .post('/api/ordens-servico')
      .send({ clienteId, aparelhoId, status: 'FECHADO', valor: 100, abertura: '2026-10-01' })
      .expect(400)
    expect(semFechamento.body.message).toBe(
      'Informe a data de fechamento para fechar a ordem de serviço',
    )

    const outro = (
      await admin.post('/api/clientes').send({ nome: 'Outro', aparelhos: [{ nome: 'Fogão' }] })
    ).body
    const aparelhoAlheio = await admin
      .post('/api/ordens-servico')
      .send({
        clienteId,
        aparelhoId: outro.aparelhos[0].id,
        status: 'ABERTO',
        valor: 0,
        abertura: '2026-10-01',
      })
      .expect(400)
    expect(aparelhoAlheio.body.message).toBe('Este aparelho não pertence ao cliente informado')
  })

  it('lança despesa, que entra negativa no caixa', async () => {
    await admin
      .post('/api/transacoes')
      .send({
        tipo: 'despesa',
        categoria: 'peca',
        data: '2026-10-02',
        descricao: 'Compressor',
        valor: 10000,
      })
      .expect(201)

    await admin
      .post('/api/transacoes')
      .send({ tipo: 'receita', categoria: 'peca', data: '2026-10-02', descricao: 'x', valor: 1 })
      .expect(400)
  })

  it('caixa inclui as duas pontas do período e conta as formas de pagamento', async () => {
    const outubro = (
      await admin.get('/api/caixa').query({ inicio: '2026-10-01', fim: '2026-10-02' }).expect(200)
    ).body
    expect(outubro.total).toBe(5000 - 10000)
    expect(outubro.formas).toMatchObject({ pix: 1, dinheiro: 1, credito: 0 })

    const novembro = (
      await admin.get('/api/caixa').query({ inicio: '2026-11-01', fim: '2026-11-30' })
    ).body
    expect(novembro.total).toBe(10000)
    expect(novembro.itens[0]).toMatchObject({
      numero: 1,
      totalParcelas: 3,
      clienteId,
      ordemServicoId: osId,
    })
  })

  it('relatório consolida OS e clientes novos', async () => {
    const outubro = (
      await admin
        .get('/api/relatorios')
        .query({ inicio: '2026-09-01', fim: '2026-10-31' })
        .expect(200)
    ).body
    expect(outubro.kpis).toMatchObject({ valorTotal: 35000, valorFechado: 35000, totalOrdens: 1 })
    expect(outubro.status.FECHADO).toBe(1)

    const novos = (await admin.get('/api/relatorios').query({ inicio: ontem, fim: amanha })).body
    expect(novos.kpis.novosClientes).toBe(2)
    expect(novos.cidades).toEqual([{ name: 'Belo Horizonte', value: 1 }])
    expect(novos.recomendacaoClientes.internet).toBe(1)
  })

  it('edita a OS substituindo os pagamentos e guardando relatado/identificado', async () => {
    const res = await admin
      .patch(`/api/ordens-servico/${osId}`)
      .send({
        relatado: 'Faz barulho',
        pagamentos: [{ valor: 35000, tipo: 'dinheiro', parcelas: 0, data: '2026-10-05' }],
      })
      .expect(200)
    expect(res.body.ordemServico.relatado).toBe('Faz barulho')
    expect(res.body.pagamentos).toHaveLength(1)
    expect(res.body.ultimasOrdens).toHaveLength(1)

    const novembro = (
      await admin.get('/api/caixa').query({ inicio: '2026-11-01', fim: '2026-11-30' })
    ).body
    expect(novembro.total).toBe(0)
  })

  it('usuário comum não acessa caixa, relatórios nem exclusões', async () => {
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'outra-senha-1', role: 'usuario' })
      .expect(201)
    const maria = request.agent(app.getHttpServer())
    await maria
      .post('/api/auth/login')
      .send({ usuario: 'maria', senha: 'outra-senha-1' })
      .expect(200)

    await maria.get('/api/caixa').expect(403)
    await maria.get('/api/relatorios').expect(403)
    await maria.delete(`/api/clientes/${clienteId}`).expect(403)
    await maria.get('/api/clientes').expect(200)
  })

  it('apagar o cliente remove aparelhos, OS, pagamentos e parcelas', async () => {
    await admin.delete(`/api/clientes/${clienteId}`).expect(204)
    await admin.get(`/api/ordens-servico/${osId}`).expect(404)
    await admin.get(`/api/clientes/${clienteId}`).expect(404)

    const caixa = (await admin.get('/api/caixa').query({ inicio: '2026-10-01', fim: '2026-10-31' }))
      .body
    expect(
      caixa.itens.every((i: { ordemServicoId: number | null }) => i.ordemServicoId === null),
    ).toBe(true)
  })
})
