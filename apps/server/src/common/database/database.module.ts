import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import type Database from 'better-sqlite3'
import { appConfig } from '../config/app.config.js'
import { abrirSqlite, criarDb, migrarSchema } from './connection.js'

export type { Db, DbLike } from './connection.js'

export const SQLITE = Symbol('SQLITE')
export const DRIZZLE = Symbol('DRIZZLE')

@Global()
@Module({
  providers: [
    {
      provide: SQLITE,
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => abrirSqlite(config.databaseFile),
    },
    {
      provide: DRIZZLE,
      inject: [SQLITE],
      useFactory: (sqlite: Database.Database) => {
        const db = criarDb(sqlite)
        migrarSchema(db)
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
