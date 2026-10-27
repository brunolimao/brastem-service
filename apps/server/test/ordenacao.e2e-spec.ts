import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/bootstrap.js'

/** Ordenar por qualquer coluna das listas e escolher o tamanho da página (docs/especificacao/tecnico/api.md). */
describe('ordenação e tamanho da página nas listagens (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>

  const ids = (resposta: { body: { items?: { id: number }[]; itens?: { id: number }[] } }) =>
    (resposta.body.items ?? resposta.body.itens ?? []).map((item) => item.id)
  const nomes = (resposta: { body: { items: { nome: string }[] } }) =>
    resposta.body.items.map((item) => item.nome)

  beforeAll(async () => {
    app = await createApp()
    await app.init()
    const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }
    await request(app.getHttpServer()).post('/api/auth/setup').send(credenciais).expect(201)
    admin = request.agent(app.getHttpServer())
    await admin.post('/api/auth/login').send(credenciais).expect(200)

    // Nomes com maiúsculas e minúsculas misturadas: a ordem não pode separar "ana" de "Ana".
    const aparelhos: number[] = []
    for (const nome of ['bruno', 'Ana', 'carla', 'Daniel']) {
      const cliente = await admin
        .post('/api/clientes')
        .send({ nome, aparelhos: [{ nome: 'Geladeira' }] })
        .expect(201)
      aparelhos.push(cliente.body.aparelhos[0].id)
    }
    // OS com valor + taxa diferentes: a coluna "Valor" mostra a soma, e é por ela que se ordena.
    const valores = [
      [10000, 0],
      [5000, 8000],
      [20000, 0],
    ]
    for (const [indice, [valor, taxa]] of valores.entries()) {
      const clienteId = indice + 1
      await admin
        .post('/api/ordens-servico')
        .send({
          clienteId,
          aparelhoId: aparelhos[indice],
          status: 'ABERTO',
          valor,
          taxaDeslocamento: taxa,
          abertura: `2026-10-0${indice + 1}`,
        })
        .expect(201)
    }
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'zeca', senha: 'senha-segura-2', role: 'usuario' })
      .expect(201)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('clientes', () => {
    it('sem ordem pedida, os mais novos primeiro (como sempre foi)', async () => {
      expect(nomes(await admin.get('/api/clientes').expect(200))).toEqual([
        'Daniel',
        'carla',
        'Ana',
        'bruno',
      ])
    })

    it('por nome, sem separar maiúsculas de minúsculas, nas duas direções', async () => {
      const crescente = await admin.get('/api/clientes').query({ ordem: 'nome' }).expect(200)
      expect(nomes(crescente)).toEqual(['Ana', 'bruno', 'carla', 'Daniel'])
      const decrescente = await admin
        .get('/api/clientes')
        .query({ ordem: 'nome', direcao: 'desc' })
        .expect(200)
      expect(nomes(decrescente)).toEqual(['Daniel', 'carla', 'bruno', 'Ana'])
    })

    it('a ordem vale para todas as páginas, não só para a atual', async () => {
      const primeira = await admin
        .get('/api/clientes')
        .query({ ordem: 'nome', pageSize: 2, page: 1 })
        .expect(200)
      const segunda = await admin
        .get('/api/clientes')
        .query({ ordem: 'nome', pageSize: 2, page: 2 })
        .expect(200)
      expect([...nomes(primeira), ...nomes(segunda)]).toEqual(['Ana', 'bruno', 'carla', 'Daniel'])
    })

    it('coluna fora da lista permitida é recusada (nada de coluna vinda da tela no SQL)', async () => {
      const resposta = await admin
        .get('/api/clientes')
        .query({ ordem: 'senha_hash; drop table clientes' })
        .expect(400)
      expect(resposta.body.message).toBe(
        'Não dá para ordenar por "senha_hash; drop table clientes".',
      )
      // Propriedade herdada de todo objeto em JavaScript também não vale como coluna.
      await admin.get('/api/clientes').query({ ordem: 'toString' }).expect(400)
      const direcao = await admin
        .get('/api/clientes')
        .query({ ordem: 'nome', direcao: 'lado' })
        .expect(400)
      expect(direcao.body.message).toEqual(['O campo "direcao" possui um valor inválido'])
    })
  })

  it('OS por valor ordena pelo valor mostrado (valor + taxa de deslocamento)', async () => {
    const resposta = await admin
      .get('/api/ordens-servico')
      .query({ ordem: 'valor', direcao: 'desc' })
      .expect(200)
    // 200,00 · 50,00 + 80,00 = 130,00 · 100,00
    expect(ids(resposta)).toEqual([3, 2, 1])
    // Todas "Aberto": o empate se resolve pelo código, na mesma direção (páginas estáveis).
    const empatadas = await admin
      .get('/api/ordens-servico')
      .query({ ordem: 'status', direcao: 'desc' })
      .expect(200)
    expect(ids(empatadas)).toEqual([3, 2, 1])
    const porCliente = await admin.get('/api/ordens-servico').query({ ordem: 'clienteNome' })
    expect(porCliente.body.items.map((os: { clienteNome: string }) => os.clienteNome)).toEqual([
      'Ana',
      'bruno',
      'carla',
    ])
  })

  it('pagamentos, caixa e usuários também ordenam', async () => {
    await admin
      .post('/api/transacoes')
      .send({ tipo: 'receita', categoria: 'venda', descricao: 'a', data: '2026-10-05', valor: 300 })
      .expect(201)
    await admin
      .post('/api/transacoes')
      .send({ tipo: 'receita', categoria: 'venda', descricao: 'b', data: '2026-10-02', valor: 900 })
      .expect(201)

    const pagamentos = await admin
      .get('/api/pagamentos')
      .query({ ordem: 'data', inicio: '2026-10-01', fim: '2026-10-31' })
      .expect(200)
    expect(pagamentos.body.items.map((p: { data: string }) => p.data)).toEqual([
      '2026-10-02',
      '2026-10-05',
    ])

    const caixa = await admin
      .get('/api/caixa')
      .query({ ordem: 'valor', direcao: 'desc', inicio: '2026-10-01', fim: '2026-10-31' })
      .expect(200)
    expect(caixa.body.itens.map((i: { valor: number }) => i.valor)).toEqual([900, 300])

    const usuarios = await admin
      .get('/api/usuarios')
      .query({ ordem: 'usuario', direcao: 'desc' })
      .expect(200)
    expect(usuarios.body.items.map((u: { usuario: string }) => u.usuario)).toEqual([
      'zeca',
      'admin',
    ])
  })

  it('aceita 10, 25, 50 ou 100 linhas por página, e nada acima de 100', async () => {
    for (const pageSize of [10, 25, 50, 100]) {
      const resposta = await admin.get('/api/clientes').query({ pageSize }).expect(200)
      expect(resposta.body.pageSize).toBe(pageSize)
    }
    await admin.get('/api/clientes').query({ pageSize: 101 }).expect(400)
  })
})
