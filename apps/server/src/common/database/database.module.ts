import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { appConfig } from '../config/app.config.js'
import * as schema from './schema/index.js'

export const SQLITE = Symbol('SQLITE')
export const DRIZZLE = Symbol('DRIZZLE')

const createDb = (sqlite: Database.Database) => drizzle(sqlite, { schema })

export type Db = ReturnType<typeof createDb>

/** Aceita tanto o banco quanto uma transação (`db.transaction((tx) => ...)`, sempre síncrona). */
export type DbLike = BaseSQLiteDatabase<'sync', Database.RunResult, typeof schema>

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

@Global()
@Module({
  providers: [
    {
      provide: SQLITE,
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => {
        if (config.databaseFile !== ':memory:') mkdirSync(config.dataDir, { recursive: true })
        const sqlite = new Database(config.databaseFile)
        sqlite.pragma('journal_mode = WAL')
        sqlite.pragma('foreign_keys = ON')
        return sqlite
      },
    },
    {
      provide: DRIZZLE,
      inject: [SQLITE],
      useFactory: (sqlite: Database.Database) => {
        const db = createDb(sqlite)
        migrate(db, { migrationsFolder })
        return db
      },
    },
  ],
  exports: [SQLITE, DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(SQLITE) private readonly sqlite: Database.Database) {}

  onApplicationShutdown() {
    this.sqlite.close()
  }
}
