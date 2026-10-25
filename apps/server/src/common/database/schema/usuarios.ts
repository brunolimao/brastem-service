import { ROLES, type Role } from '@brastem/shared'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuario: text('usuario').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  role: text('role', { enum: ROLES }).$type<Role>().notNull().default('usuario'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: text('criado_em')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Usuario = typeof usuarios.$inferSelect
export type NovoUsuario = typeof usuarios.$inferInsert
