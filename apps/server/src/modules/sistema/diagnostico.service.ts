import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { arch, platform, release, totalmem } from 'node:os'
import { join } from 'node:path'
import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import type Database from 'better-sqlite3'
import { strToU8, zipSync } from 'fflate'
import { appConfig } from '../../common/config/app.config.js'
import { situacaoDoSchema } from '../../common/database/connection.js'
import { SQLITE } from '../../common/database/database.module.js'
import { BackupService } from '../backup/backup.service.js'

/** Registros (logs) mais recentes que vão no diagnóstico: o suficiente para os últimos dias. */
export const LOGS_NO_DIAGNOSTICO = 3

/** Tabelas contadas no diagnóstico: só a quantidade de linhas, nunca o conteúdo. */
const TABELAS = [
  'clientes',
  'telefones',
  'aparelhos',
  'ordens_servico',
  'pagamentos',
  'parcelas',
  'transacoes',
  'usuarios',
] as const

/**
 * Pacote para o suporte (R-CFG-10): versões, situação do banco e do backup, quantidades e os registros
 * mais recentes. Nada de dados de clientes, da empresa, senhas, chaves nem o e-mail do Google.
 */
@Injectable()
export class DiagnosticoService {
  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    @Inject(SQLITE) private readonly sqlite: Database.Database,
    private readonly backup: BackupService,
  ) {}

  resumo(agora = new Date()) {
    const { google, ...backup } = this.backup.estado()
    return {
      geradoEm: agora.toISOString(),
      versao: this.config.versao,
      ambiente: {
        sistema: `${platform()} ${release()} (${arch()})`,
        memoriaGb: Math.round(totalmem() / 1024 ** 3),
        node: process.versions.node,
        electron: process.versions.electron ?? null,
      },
      banco: {
        tamanhoMb: this.tamanhoDoBancoMb(),
        ...situacaoDoSchema(this.sqlite),
        quantidades: Object.fromEntries(
          TABELAS.map((tabela) => [
            tabela,
            (
              this.sqlite.prepare(`select count(*) as total from ${tabela}`).get() as {
                total: number
              }
            ).total,
          ]),
        ),
      },
      backup: {
        ...backup,
        google: { configurado: google.configurado, conectado: google.conectado },
      },
    }
  }

  /** O .zip com `diagnostico.json` e os registros mais recentes em `logs/`. */
  gerar(agora = new Date()): Uint8Array {
    const arquivos: Record<string, Uint8Array> = {
      'diagnostico.json': strToU8(JSON.stringify(this.resumo(agora), null, 2)),
    }
    for (const nome of this.logsRecentes()) {
      arquivos[`logs/${nome}`] = readFileSync(join(this.config.logsDir, nome))
    }
    return zipSync(arquivos)
  }

  private logsRecentes() {
    const pasta = this.config.logsDir
    if (!existsSync(pasta)) return []
    return readdirSync(pasta)
      .filter((nome) => nome.endsWith('.log'))
      .map((nome) => ({ nome, modificado: statSync(join(pasta, nome)).mtimeMs }))
      .sort((a, b) => b.modificado - a.modificado)
      .slice(0, LOGS_NO_DIAGNOSTICO)
      .map(({ nome }) => nome)
  }

  private tamanhoDoBancoMb() {
    const arquivo = this.config.databaseFile
    if (arquivo === ':memory:' || !existsSync(arquivo)) return null
    return Math.round((statSync(arquivo).size / 1024 ** 2) * 10) / 10
  }
}
