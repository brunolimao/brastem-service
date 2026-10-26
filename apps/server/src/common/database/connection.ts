import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { format } from 'date-fns'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { moverArquivo } from '../utils/arquivos.js'
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
    moverArquivo(arquivo, antigo)
    // Um -wal que sobrou de um fechamento abrupto ainda tem dados do banco antigo.
    for (const sufixo of ['-wal', '-shm']) {
      if (existsSync(arquivo + sufixo)) moverArquivo(arquivo + sufixo, antigo + sufixo)
    }
  }

  moverArquivo(pendente, arquivo)
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

export const MENSAGEM_BANCO_MAIS_NOVO =
  'Estes dados foram gravados por uma versão mais nova do Brastem-Service. ' +
  'Instale a versão mais recente (menu Ajuda → Verificar atualizações) para abri-los.'

export interface SituacaoSchema {
  /** O banco já passou por alguma migração (não é um banco novo). */
  existente: boolean
  pendentes: number
  /** O banco tem migrações que este app não conhece (downgrade ou backup de versão mais nova). */
  maisNovo: boolean
}

/** Compara as migrações registradas no banco com as que este app traz. */
export function situacaoDoSchema(
  sqlite: Database.Database,
  pasta = migrationsFolder,
): SituacaoSchema {
  const conhecidas = readMigrationFiles({ migrationsFolder: pasta }).map((m) => m.folderMillis)
  const temTabela = sqlite
    .prepare("select 1 from sqlite_master where type = 'table' and name = '__drizzle_migrations'")
    .get()
  const ultima = temTabela
    ? (
        sqlite.prepare('select max(created_at) as ultima from __drizzle_migrations').get() as {
          ultima: number | null
        }
      ).ultima
    : null
  return {
    existente: ultima !== null,
    pendentes: conhecidas.filter((quando) => ultima === null || quando > ultima).length,
    maisNovo: ultima !== null && ultima > Math.max(...conhecidas),
  }
}

/**
 * Aplica as migrações pendentes sem arriscar os dados:
 * - recusa um banco de versão mais nova (rodar código velho sobre ele gravaria dados inconsistentes);
 * - guarda uma cópia do banco antes de mexer no schema (`backups/antes-da-migracao-*.sqlite`);
 * - desliga as chaves estrangeiras durante a migração. Recriar uma tabela (o jeito do SQLite de mudar
 *   uma coluna) faz `DROP TABLE`, que com elas ligadas apagaria em cascata OS, pagamentos e parcelas.
 *   O `PRAGMA foreign_keys=OFF` que o drizzle-kit põe na migração não vale dentro da transação dela.
 */
export function migrarSchema(db: Db, agora = new Date(), pasta = migrationsFolder) {
  const sqlite = db.$client
  const situacao = situacaoDoSchema(sqlite, pasta)
  if (situacao.maisNovo) throw new Error(MENSAGEM_BANCO_MAIS_NOVO)
  if (situacao.pendentes === 0) return

  if (situacao.existente && !sqlite.memory) {
    const pastaBackups = join(dirname(sqlite.name), 'backups')
    mkdirSync(pastaBackups, { recursive: true })
    const copia = join(
      pastaBackups,
      `antes-da-migracao-${format(agora, 'yyyy-MM-dd-HHmmss')}.sqlite`,
    )
    sqlite.exec(`vacuum into '${copia.replaceAll("'", "''")}'`)
  }

  sqlite.pragma('foreign_keys = OFF')
  try {
    migrate(db, { migrationsFolder: pasta })
    const violacoes = sqlite.pragma('foreign_key_check') as unknown[]
    if (violacoes.length > 0) {
      throw new Error(
        `A atualização do banco deixou ${violacoes.length} registro(s) sem vínculo. ` +
          'Uma cópia do banco anterior está na pasta backups (antes-da-migracao-*).',
      )
    }
  } finally {
    sqlite.pragma('foreign_keys = ON')
  }
}
