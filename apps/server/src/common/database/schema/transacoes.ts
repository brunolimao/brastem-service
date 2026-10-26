import { TIPOS_TRANSACAO, type TipoTransacao } from '@brastem/shared'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const transacoes = sqliteTable(
  'transacoes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tipo: text('tipo', { enum: TIPOS_TRANSACAO }).$type<TipoTransacao>().notNull(),
    categoria: text('categoria').notNull(),
    data: text('data').notNull(),
    descricao: text('descricao').notNull(),
    observacao: text('observacao').notNull().default(''),
    /** Valor em centavos, sempre positivo (o sinal fica nos pagamentos/parcelas). */
    valor: integer('valor').notNull(),
    criadoEm: text('criado_em')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index('transacoes_data_idx').on(t.data)],
)
