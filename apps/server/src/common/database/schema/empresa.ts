import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** Dados da empresa que aparecem na impressão da OS. Uma única linha (id = 1), preenchida na tela de configurações. */
export const empresa = sqliteTable('empresa', {
  id: integer('id').primaryKey(),
  nome: text('nome').notNull().default(''),
  cnpj: text('cnpj').notNull().default(''),
  telefone: text('telefone').notNull().default(''),
  endereco: text('endereco').notNull().default(''),
  cep: text('cep').notNull().default(''),
})

export type Empresa = typeof empresa.$inferSelect
