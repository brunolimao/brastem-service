import { verify } from '@node-rs/argon2'
import { asc } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { abrirSqlite, criarDb, type Db, migrarSchema } from '../common/database/connection.js'
import { schema } from '../common/database/index.js'
import type { DumpLegado } from './dump-parser.js'
import { migrarDoDump, type RelatorioMigracao } from './migrar.js'

/**
 * Um caso de cada situação da importação, com dados inventados (R-TST-07). Escrito a partir do relatório de
 * mutação: confere o relatório inteiro e o que foi gravado, linha por linha (R-IMPT-02 a R-IMPT-07).
 */
const dump: DumpLegado = {
  Usuarios: [
    { usuario: 'chefe', senha: 'senha-antiga', role: 'admin' },
    { usuario: 'ana', senha: '', role: 'user' },
    // Repetido na mesma tabela: vale o primeiro.
    { usuario: 'chefe', senha: 'outra', role: 'user' },
  ],
  // A tabela aparecia com os dois nomes em versões diferentes do sistema antigo.
  usuarios: [
    { usuario: 'beto', senha: 'senha-do-beto', role: 'user' },
    { usuario: '', senha: 'x', role: 'admin' },
  ],
  Clientes: [
    { id: 1, nome: 'Maria Exemplo', recomendacao: 'Internet', negativado: 'sim', motivo: 'Cheque' },
    { id: 2, nome: '', recomendacao: 'Rádio', createdAt: '2024-02-14 22:30:00' },
    { id: 'abc', nome: 'Sem código' },
  ],
  Telefones: [
    { id: 7, ClienteId: 1, nome: 'Casa', telefone: '3199990000' },
    { id: 8, ClienteId: 99, telefone: '3199990001' },
    { id: 9, ClienteId: 1, telefone: '' },
    { id: 10, ClienteId: null, telefone: '3199990002' },
  ],
  Aparelhos: [
    { id: 10, ClienteId: 1, contagem: 3, nome: '' },
    { id: 11, ClienteId: 2, nome: 'Fogão', garantia: '01/03/2026' },
    { id: 12, ClienteId: 99, nome: 'De cliente apagado' },
    { id: null, ClienteId: 1, nome: 'Sem código' },
  ],
  OrdemServicos: [
    {
      id: 100,
      ClienteId: 1,
      AparelhoId: 10,
      status: 'fechado',
      abertura: '10/01/2026',
      fechamento: '11/01/2026',
      garantia: '90 DIAS',
      valor: '100,00',
      servico: '20,00',
      isGarantia: 'nao',
    },
    {
      id: 101,
      ClienteId: 2,
      AparelhoId: 11,
      status: 'Esperando peça',
      abertura: 'lixo',
      createdAt: '2026-02-03 10:00:00',
      valor: '50',
    },
    { id: 102, ClienteId: 1, AparelhoId: 12, status: 'ABERTO', abertura: '2026-01-01' },
    { id: 103, ClienteId: null, AparelhoId: 10, abertura: '2026-01-01' },
    { id: 104, ClienteId: 1, AparelhoId: null, abertura: '2026-01-01' },
    { id: null, ClienteId: 1, AparelhoId: 10, abertura: '2026-01-01' },
    { id: 105, ClienteId: 99, AparelhoId: 10, abertura: '2026-01-01' },
  ],
  Transacaos: [
    {
      id: 1,
      tipo: 'despesa',
      categoria: '',
      descricao: '',
      valor: '-50,00',
      data: '2026-03-01',
      createdAt: '2026-03-01 08:00:00',
    },
    {
      id: 2,
      tipo: 'qualquer',
      categoria: 'venda',
      descricao: 'Peça',
      valor: '10',
      data: '05/03/2026',
    },
    { id: 3, tipo: 'receita', data: 'lixo' },
    { id: null, tipo: 'receita', data: '2026-03-01' },
  ],
  Pagamentos: [
    // Parcelas antigas fora de ordem, somando 1 centavo a menos: o centavo vai para a última.
    { id: 500, OrdemServicoId: 100, tipo: 'credito', parcela: 2, valorPagamento: '100,00' },
    // Sem parcelas no antigo e à vista: uma entrada na data informada.
    {
      id: 501,
      TransacaoId: 1,
      tipo: 'dinheiro',
      parcela: 0,
      valorPagamento: '50,00',
      dataParcela: '2026-03-01',
    },
    // Sem parcelas no antigo e em 3x: regeradas, a primeira um mês depois.
    {
      id: 502,
      OrdemServicoId: 100,
      tipo: 'PIX',
      parcela: 3,
      valorPagamento: '20,00',
      dataParcela: '15/01/2026',
    },
    // Órfão: a OS não existe mais. Não entra, mas o valor aparece no aviso.
    { id: 503, OrdemServicoId: 999, tipo: 'dinheiro', parcela: 0, valorPagamento: '30,00' },
    { id: null, OrdemServicoId: 100, valorPagamento: '5,00' },
    // Forma desconhecida vira cheque; parcelas negativas, à vista; sem data, usa a abertura da OS.
    { id: 505, OrdemServicoId: 101, tipo: 'vale', parcela: -2, valorPagamento: '50' },
    // Parcelas que não fecham com o valor (muito além dos centavos): mantidas e avisadas.
    { id: 506, OrdemServicoId: 101, tipo: 'debito', parcela: 1, valorPagamento: '100,00' },
    // Sem OS nem lançamento: órfão também.
    { id: 507, tipo: 'dinheiro', valorPagamento: '1,00' },
    // Do lançamento 2, sem data: usa a data de criação.
    {
      id: 508,
      TransacaoId: 2,
      tipo: 'dinheiro',
      valorPagamento: '10',
      createdAt: '2026-03-05 09:00:00',
    },
  ],
  Parcelas: [
    { PagamentoId: 500, parcela: 2, valorPagamento: '49,99', dataParcela: '2026-03-10' },
    { PagamentoId: 500, parcela: 1, valorPagamento: '50,00', dataParcela: '2026-02-10' },
    { PagamentoId: 503, parcela: 0, valorPagamento: '30,00' },
    { PagamentoId: 506, parcela: 1, valorPagamento: '50,00', dataParcela: '' },
    { PagamentoId: null, parcela: 1, valorPagamento: '9,99' },
  ],
}

describe('importação: um caso de cada situação', () => {
  let db: Db
  let relatorio: RelatorioMigracao

  beforeAll(async () => {
    db = criarDb(abrirSqlite(':memory:'))
    migrarSchema(db)
    relatorio = await migrarDoDump(db, dump)
  })

  it('relatório: o que foi lido, importado e ignorado em cada tabela, com os totais', () => {
    expect(relatorio.tabelas).toEqual({
      usuarios: { lidos: 5, importados: 3, ignorados: 2 },
      clientes: { lidos: 3, importados: 2, ignorados: 1 },
      telefones: { lidos: 4, importados: 1, ignorados: 3 },
      aparelhos: { lidos: 4, importados: 2, ignorados: 2 },
      ordens_servico: { lidos: 7, importados: 2, ignorados: 5 },
      transacoes: { lidos: 4, importados: 2, ignorados: 2 },
      pagamentos: { lidos: 9, importados: 6, ignorados: 3 },
      // 9 gravadas: 2 antigas acertadas, 1 antiga mantida e 6 regeradas; 2 antigas sem dono ficaram de fora.
      parcelas: { lidos: 5, importados: 9, ignorados: 2 },
    })
    expect(relatorio.totais).toEqual({ ordensServico: 17000, pagamentos: 33000, parcelas: 28000 })
  })

  it('avisos: o que foi corrigido ou deixado de fora, na ordem em que aconteceu (R-IMPT-04, R-IMPT-05)', () => {
    expect(relatorio.avisos).toEqual([
      'Usuário "ana" estava sem senha: foi gerada uma aleatória, redefina-a.',
      'Recomendações fora do padrão viraram "porta": Rádio',
      'OS 101: abertura inválida, usada a data de criação.',
      'OS 102 ignorada: sem cliente ou aparelho válido.',
      'OS 103 ignorada: sem cliente ou aparelho válido.',
      'OS 104 ignorada: sem cliente ou aparelho válido.',
      'OS (sem código) ignorada: sem cliente ou aparelho válido.',
      'OS 105 ignorada: sem cliente ou aparelho válido.',
      '1 OS com status fora do padrão viraram APROVADO.',
      '1 aparelho(s) com a garantia recalculada pelas OS (no sistema antigo, garantias escritas como "90 DIAS" não eram somadas à data de fechamento).',
      'Pagamento 506: parcelas somam 5000 e o pagamento 10000 (centavos).',
      '3 pagamentos sem OS (cliente ou OS apagados no sistema antigo) não foram importados: R$ 36,00 em pagamentos, R$ 30,00 deles em parcelas que apareciam no caixa antigo.',
      '1 pagamentos com forma fora do padrão viraram "cheque".',
      '4 pagamentos estavam sem parcelas no sistema antigo e foram regerados.',
      '1 pagamentos têm parcelas que não somam o valor (mantidas como estavam).',
    ])
  })

  it('usuários: papel do antigo, senha antiga valendo e aleatória para quem não tinha (R-IMPT-06)', async () => {
    const usuarios = db.select().from(schema.usuarios).orderBy(asc(schema.usuarios.id)).all()
    expect(usuarios.map((u) => [u.usuario, u.role])).toEqual([
      ['beto', 'usuario'],
      ['chefe', 'admin'],
      ['ana', 'usuario'],
    ])
    const [beto, chefe, ana] = usuarios
    expect(await verify(chefe?.senhaHash ?? '', 'senha-antiga')).toBe(true)
    expect(await verify(beto?.senhaHash ?? '', 'senha-do-beto')).toBe(true)
    expect(await verify(ana?.senhaHash ?? '', '')).toBe(false)
  })

  it('clientes, telefones e aparelhos com os códigos do antigo; órfãos ficam de fora (R-IMPT-02)', () => {
    expect(db.select().from(schema.clientes).orderBy(asc(schema.clientes.id)).all()).toMatchObject([
      {
        id: 1,
        nome: 'Maria Exemplo',
        recomendacao: 'internet',
        negativado: true,
        motivo: 'Cheque',
      },
      // Sem nome, recomendação desconhecida e cadastro às 22h30 de Brasília (01h30 do dia seguinte em UTC).
      { id: 2, nome: '(sem nome)', recomendacao: 'porta', criadoEm: '2024-02-15T01:30:00.000Z' },
    ])
    expect(db.select().from(schema.telefones).all()).toEqual([
      { id: 7, clienteId: 1, nome: 'Casa', telefone: '3199990000' },
    ])
    expect(
      db.select().from(schema.aparelhos).orderBy(asc(schema.aparelhos.id)).all(),
    ).toMatchObject([
      // Sem nome; ordem do antigo; garantia vinda da OS fechada (11/01 + 90 dias).
      {
        id: 10,
        clienteId: 1,
        ordem: 3,
        nome: '(sem nome)',
        garantiaAte: '2026-04-11',
        garantiaImportada: null,
      },
      // Sem ordem no antigo: a posição na lista; garantia antiga mantida como piso.
      {
        id: 11,
        clienteId: 2,
        ordem: 2,
        nome: 'Fogão',
        garantiaAte: '2026-03-01',
        garantiaImportada: '2026-03-01',
      },
    ])
  })

  it('OS: status, valores e datas convertidos; abertura inválida usa a de criação (R-IMPT-03)', () => {
    expect(
      db.select().from(schema.ordensServico).orderBy(asc(schema.ordensServico.id)).all(),
    ).toMatchObject([
      {
        id: 100,
        status: 'FECHADO',
        valor: 10000,
        taxaDeslocamento: 2000,
        garantiaDias: 90,
        isGarantia: false,
        abertura: '2026-01-10',
        fechamento: '2026-01-11',
      },
      {
        id: 101,
        status: 'APROVADO',
        valor: 5000,
        taxaDeslocamento: 0,
        abertura: '2026-02-03',
        fechamento: null,
      },
    ])
  })

  it('lançamentos: despesa em valor positivo, categoria e descrição padrão quando vazias', () => {
    expect(
      db.select().from(schema.transacoes).orderBy(asc(schema.transacoes.id)).all(),
    ).toMatchObject([
      {
        id: 1,
        tipo: 'despesa',
        categoria: 'outros',
        descricao: '(sem descrição)',
        valor: 5000,
        data: '2026-03-01',
      },
      // Tipo desconhecido vira receita.
      {
        id: 2,
        tipo: 'receita',
        categoria: 'venda',
        descricao: 'Peça',
        valor: 1000,
        data: '2026-03-05',
      },
    ])
  })

  it('pagamentos: dono, forma e data de cada um; parcelas antigas acertadas, mantidas ou regeradas', () => {
    const { pagamentos, parcelas } = schema
    expect(
      db
        .select({
          id: pagamentos.id,
          os: pagamentos.ordemServicoId,
          lancamento: pagamentos.transacaoId,
          tipo: pagamentos.tipo,
          parcelas: pagamentos.parcelas,
          data: pagamentos.data,
          valor: pagamentos.valor,
        })
        .from(pagamentos)
        .orderBy(asc(pagamentos.id))
        .all(),
    ).toEqual([
      // Sem data: a abertura da OS.
      {
        id: 500,
        os: 100,
        lancamento: null,
        tipo: 'credito',
        parcelas: 2,
        data: '2026-01-10',
        valor: 10000,
      },
      {
        id: 501,
        os: null,
        lancamento: 1,
        tipo: 'dinheiro',
        parcelas: 0,
        data: '2026-03-01',
        valor: 5000,
      },
      {
        id: 502,
        os: 100,
        lancamento: null,
        tipo: 'pix',
        parcelas: 3,
        data: '2026-01-15',
        valor: 2000,
      },
      // Forma desconhecida: cheque; parcelas negativas: à vista.
      {
        id: 505,
        os: 101,
        lancamento: null,
        tipo: 'cheque',
        parcelas: 0,
        data: '2026-02-03',
        valor: 5000,
      },
      {
        id: 506,
        os: 101,
        lancamento: null,
        tipo: 'debito',
        parcelas: 1,
        data: '2026-02-03',
        valor: 10000,
      },
      // Do lançamento e sem data: a data de criação.
      {
        id: 508,
        os: null,
        lancamento: 2,
        tipo: 'dinheiro',
        parcelas: 0,
        data: '2026-03-05',
        valor: 1000,
      },
    ])

    expect(
      db
        .select({
          pagamento: parcelas.pagamentoId,
          numero: parcelas.numero,
          data: parcelas.data,
          valor: parcelas.valor,
        })
        .from(parcelas)
        .orderBy(asc(parcelas.id))
        .all(),
    ).toEqual([
      // Antigas fora de ordem: ordenadas, e o centavo que faltava vai para a última.
      { pagamento: 500, numero: 1, data: '2026-02-10', valor: 5000 },
      { pagamento: 500, numero: 2, data: '2026-03-10', valor: 5000 },
      { pagamento: 501, numero: 0, data: '2026-03-01', valor: 5000 },
      // Regeradas em 3x: a primeira um mês depois, o resto dos centavos na última.
      { pagamento: 502, numero: 1, data: '2026-02-15', valor: 666 },
      { pagamento: 502, numero: 2, data: '2026-03-15', valor: 666 },
      { pagamento: 502, numero: 3, data: '2026-04-15', valor: 668 },
      { pagamento: 505, numero: 0, data: '2026-02-03', valor: 5000 },
      // Antiga que não fecha com o valor: mantida como estava (sem data, a do pagamento).
      { pagamento: 506, numero: 1, data: '2026-02-03', valor: 5000 },
      { pagamento: 508, numero: 0, data: '2026-03-05', valor: 1000 },
    ])
  })
})
