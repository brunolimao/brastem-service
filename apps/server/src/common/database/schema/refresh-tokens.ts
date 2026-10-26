import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { usuarios } from './usuarios.js'

export const refreshTokens = sqliteTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiraEm: text('expira_em').notNull(),
    revogado: integer('revogado', { mode: 'boolean' }).notNull().default(false),
    criadoEm: text('criado_em')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index('refresh_tokens_usuario_id_idx').on(t.usuarioId)],
)
