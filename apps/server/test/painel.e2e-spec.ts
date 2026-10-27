import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { format, subDays } from 'date-fns'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** Resumo do Início (docs/especificacao/modulos/inicio.md). Datas relativas a hoje. */
describe('painel do Início (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  let comum: ReturnType<typeof request.agent>
  const dia = (atras: number) => format(subDays(new Date(), atras), 'yyyy-MM-dd')

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    const servidor = app.getHttpServer()
    await request(servidor)
      .post('/api/auth/setup')
      .send({ usuario: 'admin', senha: 'senha-segura-1' })
      .expect(201)
    admin = request.agent(servidor)
    await admin.post('/api/auth/login').send({ usuario: 'admin', senha: 'senha-segura-1' })
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'balcao', senha: 'senha-segura-2', role: 'usuario' })
      .expect(201)
    comum = request.agent(servidor)
    await comum.post('/api/auth/login').send({ usuario: 'balcao', senha: 'senha-segura-2' })

    const cliente = await admin
      .post('/api/clientes')
      .send({ nome: 'Maria', aparelhos: [{ nome: 'Geladeira' }, { nome: 'Fogão' }] })
      .expect(201)
    const [geladeira, fogao] = cliente.body.aparelhos
    const os = (aparelhoId: number, dados: Record<string, unknown>) =>
      admin
        .post('/api/ordens-servico')
        .send({ clienteId: cliente.body.id, aparelhoId, valor: 10000, ...dados })
        .expect(201)

    // Em andamento: uma aberta hoje, uma aguardando há 20 dias, uma aprovada há 5 dias.
    await os(geladeira.id, { status: 'ABERTO', abertura: dia(0) })
    await os(geladeira.id, { status: 'AGUARDANDO', abertura: dia(20) })
    await os(fogao.id, { status: 'APROVADO', abertura: dia(5) })
    // Fechada hoje (com pagamento à vista) e cancelada: não estão em andamento.
    await os(fogao.id, {
      status: 'FECHADO',
      abertura: dia(0),
      fechamento: dia(0),
      pagamentos: [{ valor: 10000, tipo: 'pix', parcelas: 0, data: dia(0) }],
    })
    await os(fogao.id, { status: 'CANCELADO', abertura: dia(0) })
  })

  afterAll(async () => {
    await app.close()
  })

  it('OS em andamento por status, abertas hoje, fechadas no mês e clientes novos', async () => {
    const { body } = await comum.get('/api/painel').expect(200)
    expect(body.ordens).toEqual({
      emAndamento: { ABERTO: 1, AGUARDANDO: 1, APROVADO: 1 },
      abertasHoje: 3,
      fechadasNoMes: 1,
    })
    expect(body.clientesNovosNoMes).toBe(1)
  })

  it('as OS paradas há mais tempo primeiro, com os dias desde a abertura', async () => {
    const { body } = await comum.get('/api/painel').expect(200)
    expect(body.paradas.map((p: { status: string; dias: number }) => [p.status, p.dias])).toEqual([
      ['AGUARDANDO', 20],
      ['APROVADO', 5],
      ['ABERTO', 0],
    ])
    expect(body.paradas[0]).toMatchObject({ clienteNome: 'Maria', aparelhoNome: 'Geladeira' })
  })

  it('números do financeiro só para o administrador (R-PERM-03)', async () => {
    const doComum = await comum.get('/api/painel').expect(200)
    expect(doComum.body.financeiro).toBeUndefined()

    const doAdmin = await admin.get('/api/painel').expect(200)
    // Faturamento: OS fechadas fora de garantia abertas no mês; caixa: pagamentos do mês.
    expect(doAdmin.body.financeiro).toEqual({ faturamentoMes: 10000, caixaMes: 10000 })
  })

  it('só para quem está logado', async () => {
    await request(app.getHttpServer()).get('/api/painel').expect(401)
  })
})
