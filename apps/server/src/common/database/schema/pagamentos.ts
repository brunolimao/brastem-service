import { TIPOS_PAGAMENTO, type TipoPagamento } from '@brastem/shared'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { ordensServico } from './ordens-servico.js'
import { transacoes } from './transacoes.js'

/** Um pagamento pertence a uma OS ou a uma transação (receita/despesa). Despesas têm valor negativo. */
export const pagamentos = sqliteTable('pagamentos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ordemServicoId: integer('ordem_servico_id').references(() => ordensServico.id, {
    onDelete: 'cascade',
  }),
  transacaoId: integer('transacao_id').references(() => transacoes.id, { onDelete: 'cascade' }),
  tipo: text('tipo', { enum: TIPOS_PAGAMENTO }).$type<TipoPagamento>().notNull(),
  /** Quantidade de parcelas; 0 = à vista. */
  parcelas: integer('parcelas').notNull().default(0),
  /** Data do pagamento à vista ou da compra parcelada (yyyy-MM-dd). */
  data: text('data').notNull(),
  valor: integer('valor').notNull(),
  observacao: text('observacao').notNull().default(''),
  criadoEm: text('criado_em')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const parcelas = sqliteTable('parcelas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pagamentoId: integer('pagamento_id')
    .notNull()
    .references(() => pagamentos.id, { onDelete: 'cascade' }),
  /** 0 = à vista; 1..N = parcela. */
  numero: integer('numero').notNull(),
  data: text('data').notNull(),
  valor: integer('valor').notNull(),
})
