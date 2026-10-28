import { asc } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { abrirSqlite, criarDb, migrarSchema } from '../common/database/connection.js'
import { schema } from '../common/database/index.js'
import type { DumpLegado } from './dump-parser.js'
import { migrarDoDump } from './migrar.js'

/**
 * Limites da importação que o cenário de `migrar.spec.ts` não alcança, achados pelo relatório de mutação:
 * dump sem tabelas, teto de avisos, acerto de centavos no limite e donos inválidos (R-IMPT-03 a R-IMPT-07).
 */
const importar = async (dump: DumpLegado) => {
  const db = criarDb(abrirSqlite(':memory:'))
  migrarSchema(db)
  return { db, relatorio: await migrarDoDump(db, dump) }
}

describe('importação: limites', () => {
  it('dump sem nenhuma tabela: nada lido, nada importado e nenhum aviso', async () => {
    const { relatorio } = await importar({})
    expect(relatorio.avisos).toEqual([])
    expect(relatorio.totais).toEqual({ ordensServico: 0, pagamentos: 0, parcelas: 0 })
    for (const [tabela, resumo] of Object.entries(relatorio.tabelas)) {
      expect(resumo, tabela).toEqual({ lidos: 0, importados: 0, ignorados: 0 })
    }
    expect(Object.keys(relatorio.tabelas)).toEqual([
      'usuarios',
      'clientes',
      'telefones',
      'aparelhos',
      'ordens_servico',
      'transacoes',
      'pagamentos',
      'parcelas',
    ])
  })

  it('guarda no máximo 200 avisos (o resto só conta nos números)', async () => {
    const orfas = Array.from({ length: 250 }, (_, indice) => ({
      id: indice + 1,
      ClienteId: 99,
      AparelhoId: 99,
    }))
    const { relatorio } = await importar({ OrdemServicos: orfas })
    expect(relatorio.avisos).toHaveLength(200)
    expect(relatorio.avisos.at(-1)).toBe('OS 200 ignorada: sem cliente ou aparelho válido.')
    expect(relatorio.tabelas.ordens_servico).toEqual({ lidos: 250, importados: 0, ignorados: 250 })
  })

  it('parcelas antigas: acerta até 1 centavo por parcela; acima disso, mantém e avisa', async () => {
    const { db, relatorio } = await importar({
      Clientes: [{ id: 1, nome: 'Maria', recomendacao: 'internet' }],
      Aparelhos: [{ id: 1, ClienteId: 1, nome: 'Geladeira' }],
      OrdemServicos: [
        { id: 1, ClienteId: 1, AparelhoId: 1, status: 'ABERTO', abertura: '2026-01-01' },
      ],
      Pagamentos: [
        // 2 parcelas, faltando exatamente 2 centavos: ainda é arredondamento.
        { id: 1, OrdemServicoId: 1, tipo: 'pix', parcela: 2, valorPagamento: '100,00' },
        // 2 parcelas, faltando 3 centavos: já não é arredondamento.
        { id: 2, OrdemServicoId: 1, tipo: 'pix', parcela: 2, valorPagamento: '100,00' },
        // Fecha certinho: nada a acertar.
        { id: 3, OrdemServicoId: 1, tipo: 'pix', parcela: 1, valorPagamento: '10,00' },
      ],
      Parcelas: [
        { PagamentoId: 1, parcela: 1, valorPagamento: '49,99', dataParcela: '2026-02-01' },
        { PagamentoId: 1, parcela: 2, valorPagamento: '49,99', dataParcela: '2026-03-01' },
        { PagamentoId: 2, parcela: 1, valorPagamento: '49,99', dataParcela: '2026-02-01' },
        { PagamentoId: 2, parcela: 2, valorPagamento: '49,98', dataParcela: '2026-03-01' },
        { PagamentoId: 3, parcela: 1, valorPagamento: '10,00', dataParcela: '2026-02-01' },
      ],
    })
    expect(
      db
        .select({ pagamento: schema.parcelas.pagamentoId, valor: schema.parcelas.valor })
        .from(schema.parcelas)
        .orderBy(asc(schema.parcelas.id))
        .all(),
    ).toEqual([
      { pagamento: 1, valor: 4999 },
      { pagamento: 1, valor: 5001 },
      { pagamento: 2, valor: 4999 },
      { pagamento: 2, valor: 4998 },
      { pagamento: 3, valor: 1000 },
    ])
    expect(relatorio.avisos).toEqual([
      'Pagamento 2: parcelas somam 9997 e o pagamento 10000 (centavos).',
      '1 pagamentos têm parcelas que não somam o valor (mantidas como estavam).',
    ])
  })

  it('pagamento com a OS apagada mas o lançamento válido fica só no lançamento', async () => {
    const { db } = await importar({
      Transacaos: [{ id: 1, tipo: 'receita', data: '2026-03-01', valor: '10' }],
      Pagamentos: [
        { id: 1, OrdemServicoId: 999, TransacaoId: 1, tipo: 'pix', valorPagamento: '10' },
      ],
    })
    expect(
      db
        .select({ os: schema.pagamentos.ordemServicoId, lancamento: schema.pagamentos.transacaoId })
        .from(schema.pagamentos)
        .all(),
    ).toEqual([{ os: null, lancamento: 1 }])
  })

  it('conta só os aparelhos em que a garantia mudou', async () => {
    const os = (id: number, aparelho: number) => ({
      id,
      ClienteId: 1,
      AparelhoId: aparelho,
      status: 'FECHADO',
      abertura: '2026-01-01',
      fechamento: '2026-01-02',
      garantia: '30',
    })
    const { relatorio } = await importar({
      Clientes: [{ id: 1, nome: 'Maria', recomendacao: 'internet' }],
      Aparelhos: [
        { id: 1, ClienteId: 1, nome: 'Geladeira' },
        { id: 2, ClienteId: 1, nome: 'Fogão' },
        // A garantia antiga é maior que a das OS: fica como estava.
        { id: 3, ClienteId: 1, nome: 'Freezer', garantia: '2027-01-01' },
      ],
      OrdemServicos: [os(1, 1), os(2, 2), os(3, 3)],
    })
    expect(relatorio.avisos).toEqual([
      '2 aparelho(s) com a garantia recalculada pelas OS (no sistema antigo, garantias escritas como "90 DIAS" não eram somadas à data de fechamento).',
    ])
  })
})
