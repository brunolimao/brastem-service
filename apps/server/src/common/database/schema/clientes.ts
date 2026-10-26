import { RECOMENDACOES, type Recomendacao } from '@brastem/shared'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const clientes = sqliteTable('clientes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  cpf: text('cpf').notNull().default(''),
  email: text('email').notNull().default(''),
  endereco: text('endereco').notNull().default(''),
  numero: text('numero').notNull().default(''),
  complemento: text('complemento').notNull().default(''),
  bairro: text('bairro').notNull().default(''),
  cep: text('cep').notNull().default(''),
  uf: text('uf').notNull().default(''),
  cidade: text('cidade').notNull().default(''),
  negativado: integer('negativado', { mode: 'boolean' }).notNull().default(false),
  motivo: text('motivo').notNull().default(''),
  recomendacao: text('recomendacao', { enum: RECOMENDACOES })
    .$type<Recomendacao>()
    .notNull()
    .default('antigo'),
  referencia: text('referencia').notNull().default(''),
  criadoEm: text('criado_em')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const telefones = sqliteTable(
  'telefones',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull().default(''),
    telefone: text('telefone').notNull(),
  },
  (t) => [index('telefones_cliente_id_idx').on(t.clienteId)],
)

export const aparelhos = sqliteTable(
  'aparelhos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    /** Posição do aparelho na lista do cliente (1, 2, 3...). */
    ordem: integer('ordem').notNull().default(1),
    nome: text('nome').notNull(),
    marca: text('marca').notNull().default(''),
    modelo: text('modelo').notNull().default(''),
    pnc: text('pnc').notNull().default(''),
    /** Fim da garantia (yyyy-MM-dd). */
    garantiaAte: text('garantia_ate'),
    /**
     * Garantia que veio do sistema antigo (yyyy-MM-dd). Ela pode não ter uma OS que a explique, então
     * o recálculo da garantia (pela maior entre as OS fechadas) nunca fica abaixo dela.
     */
    garantiaImportada: text('garantia_importada'),
    observacao: text('observacao').notNull().default(''),
  },
  (t) => [index('aparelhos_cliente_id_idx').on(t.clienteId)],
)
