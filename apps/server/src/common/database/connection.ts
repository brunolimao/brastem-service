import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { format } from 'date-fns'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from './schema/index.js'

export const criarDb = (sqlite: Database.Database) => drizzle(sqlite, { schema })

export type Db = ReturnType<typeof criarDb>

/** Aceita tanto o banco quanto uma transação (`db.transaction((tx) => ...)`, sempre síncrona). */
export type DbLike = BaseSQLiteDatabase<'sync', Database.RunResult, typeof schema>

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

/** Arquivo que a tela de backup deixa ao lado do banco para ser trocado na próxima abertura. */
export const NOME_RESTAURACAO_PENDENTE = 'restauracao-pendente.sqlite'

/**
 * Se há uma restauração pendente, troca o banco atual por ela. Precisa rodar antes de abrir o banco:
 * trocar o arquivo com o servidor usando-o corromperia a conexão aberta.
 * O banco antigo não é apagado, vai para `backups/antes-da-restauracao-*.sqlite`.
 */
export function aplicarRestauracaoPendente(arquivo: string, agora = new Date()): boolean {
  if (arquivo === ':memory:') return false

  const pasta = dirname(arquivo)
  const pendente = join(pasta, NOME_RESTAURACAO_PENDENTE)
  if (!existsSync(pendente)) return false

  if (existsSync(arquivo)) {
    const pastaBackups = join(pasta, 'backups')
    mkdirSync(pastaBackups, { recursive: true })
    const antigo = join(
      pastaBackups,
      `antes-da-restauracao-${format(agora, 'yyyy-MM-dd-HHmmss')}.sqlite`,
    )
    renameSync(arquivo, antigo)
    // Um -wal que sobrou de um fechamento abrupto ainda tem dados do banco antigo.
    for (const sufixo of ['-wal', '-shm']) {
      if (existsSync(arquivo + sufixo)) renameSync(arquivo + sufixo, antigo + sufixo)
    }
  }

  renameSync(pendente, arquivo)
  rmSync(`${arquivo}-wal`, { force: true })
  rmSync(`${arquivo}-shm`, { force: true })
  return true
}

export function abrirSqlite(arquivo: string) {
  if (arquivo !== ':memory:') mkdirSync(dirname(arquivo), { recursive: true })
  aplicarRestauracaoPendente(arquivo)
  const sqlite = new Database(arquivo)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

export function migrarSchema(db: Db) {
  migrate(db, { migrationsFolder })
}
