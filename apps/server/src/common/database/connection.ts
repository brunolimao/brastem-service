import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from './schema/index.js'

export const criarDb = (sqlite: Database.Database) => drizzle(sqlite, { schema })

export type Db = ReturnType<typeof criarDb>

/** Aceita tanto o banco quanto uma transação (`db.transaction((tx) => ...)`, sempre síncrona). */
export type DbLike = BaseSQLiteDatabase<'sync', Database.RunResult, typeof schema>

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

export function abrirSqlite(arquivo: string) {
  if (arquivo !== ':memory:') mkdirSync(dirname(arquivo), { recursive: true })
  const sqlite = new Database(arquivo)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

export function migrarSchema(db: Db) {
  migrate(db, { migrationsFolder })
}
