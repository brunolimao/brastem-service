import { STATUS_OS, type StatusOS } from '@brastem/shared'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { aparelhos, clientes } from './clientes.js'

export const ordensServico = sqliteTable('ordens_servico', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  aparelhoId: integer('aparelho_id')
    .notNull()
    .references(() => aparelhos.id, { onDelete: 'cascade' }),
  status: text('status', { enum: STATUS_OS }).$type<StatusOS>().notNull().default('ABERTO'),
  /** Valores em centavos. */
  valor: integer('valor').notNull().default(0),
  taxaDeslocamento: integer('taxa_deslocamento').notNull().default(0),
  relatado: text('relatado').notNull().default(''),
  identificado: text('identificado').notNull().default(''),
  solucionado: text('solucionado').notNull().default(''),
  observacao: text('observacao').notNull().default(''),
  garantiaDias: integer('garantia_dias'),
  isGarantia: integer('is_garantia', { mode: 'boolean' }).notNull().default(false),
  /** Datas no formato yyyy-MM-dd. */
  abertura: text('abertura').notNull(),
  fechamento: text('fechamento'),
  criadoEm: text('criado_em')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})
