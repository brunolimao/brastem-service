import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import type Database from 'better-sqlite3'
import { format } from 'date-fns'
import { appConfig } from '../../common/config/app.config.js'
import { SQLITE } from '../../common/database/index.js'
import { ArmazenamentoJson } from './armazenamento-json.js'
import { type ArquivoDrive, GoogleDriveClient } from './google-drive.client.js'
import { type EstadoGoogle, GoogleOauthService } from './google-oauth.service.js'

const UMA_HORA_MS = 60 * 60 * 1000

export type OrigemBackup = 'automatico' | 'manual'

interface EstadoSalvo {
  ultimoBackup?: { criadoEm: string; arquivo: string; tamanho: number; origem: OrigemBackup }
  ultimoEnvioDrive?: string
  ultimoErro?: { em: string; mensagem: string }
  /** Arquivo local que ainda não subiu para o Drive (sem internet, por exemplo). */
  pendenteDrive?: string
}

export interface ArquivoBackup {
  id: string
  nome: string
  tamanho: number
  criadoEm: string
}

export interface EstadoBackup {
  google: EstadoGoogle
  ultimoBackup: EstadoSalvo['ultimoBackup'] | null
  ultimoEnvioDrive: string | null
  ultimoErro: EstadoSalvo['ultimoErro'] | null
  pendenteDrive: boolean
  proximoBackup: string | null
}

/** Backups feitos pelo app: `brastem-AAAA-MM-DD-HHmmss.sqlite.gz`. */
export const PADRAO_BACKUP = /^brastem-\d{4}-\d{2}-\d{2}-\d{6}\.sqlite\.gz$/

/**
 * Arquivos da pasta de backups que podem ser restaurados pela tela: os do dia a dia e as cópias que o
 * app guarda sozinho antes de restaurar um backup e antes de atualizar a estrutura do banco.
 */
export const PADRAO_BACKUP_LOCAL =
  /^(brastem|antes-da-restauracao|antes-da-migracao)-[\w-]+\.sqlite(\.gz)?$/

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name)
  private readonly estadoSalvo: ArmazenamentoJson<EstadoSalvo>
  private emAndamento = false

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    @Inject(SQLITE) private readonly sqlite: Database.Database,
    private readonly google: GoogleOauthService,
    private readonly drive: GoogleDriveClient,
  ) {
    this.estadoSalvo = new ArmazenamentoJson(join(config.backup.dir, 'estado.json'))
  }

  private ler(): EstadoSalvo {
    return this.estadoSalvo.ler() ?? {}
  }

  estado(): EstadoBackup {
    const salvo = this.ler()
    const ultimo = salvo.ultimoBackup
    return {
      google: this.google.estado(),
      ultimoBackup: ultimo ?? null,
      ultimoEnvioDrive: salvo.ultimoEnvioDrive ?? null,
      ultimoErro: salvo.ultimoErro ?? null,
      pendenteDrive: Boolean(salvo.pendenteDrive),
      proximoBackup: ultimo
        ? new Date(
            Date.parse(ultimo.criadoEm) + this.config.backup.intervaloHoras * UMA_HORA_MS,
          ).toISOString()
        : null,
    }
  }

  /** Cópia consistente do banco (mesmo com o app em uso), compactada, na pasta de backups. */
  async executar(origem: OrigemBackup): Promise<EstadoBackup> {
    if (this.emAndamento) throw new ConflictException('Já existe um backup em andamento.')
    this.emAndamento = true

    try {
      const arquivo = await this.criarCopiaLocal()
      const salvo = this.ler()
      this.estadoSalvo.gravar({
        ...salvo,
        ultimoBackup: { criadoEm: new Date().toISOString(), ...arquivo, origem },
        pendenteDrive: this.google.estado().conectado ? arquivo.arquivo : undefined,
        ultimoErro: undefined,
      })
      this.podarLocais()
      await this.enviarPendente()
      return this.estado()
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro)
      this.estadoSalvo.gravar({
        ...this.ler(),
        ultimoErro: { em: new Date().toISOString(), mensagem },
      })
      throw erro
    } finally {
      this.emAndamento = false
    }
  }

  /**
   * Chamado de hora em hora (e ao abrir o app): primeiro tenta subir um backup que ficou pendente;
   * senão, faz um novo se o último já passou do intervalo. Assim um PC desligado na hora marcada não pula o dia.
   */
  async executarSeNecessario(): Promise<void> {
    // Um backup manual em andamento já cuida do envio: rodar junto subiria o arquivo duas vezes.
    if (this.emAndamento) return
    const salvo = this.ler()
    if (salvo.pendenteDrive) {
      this.emAndamento = true
      try {
        await this.enviarPendente()
      } finally {
        this.emAndamento = false
      }
      return
    }
    const ultimo = salvo.ultimoBackup ? Date.parse(salvo.ultimoBackup.criadoEm) : 0
    if (Date.now() - ultimo >= this.config.backup.intervaloHoras * UMA_HORA_MS) {
      await this.executar('automatico')
    }
  }

  async enviarPendente(): Promise<void> {
    const salvo = this.ler()
    const nome = salvo.pendenteDrive
    if (!nome) return

    const caminho = join(this.config.backup.dir, nome)
    if (!existsSync(caminho)) {
      this.estadoSalvo.gravar({ ...salvo, pendenteDrive: undefined })
      return
    }

    try {
      await this.drive.enviar(nome, readFileSync(caminho))
      await this.podarDrive()
      this.estadoSalvo.gravar({
        ...this.ler(),
        ultimoEnvioDrive: new Date().toISOString(),
        pendenteDrive: undefined,
        ultimoErro: undefined,
      })
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      this.logger.warn(`Envio ao Google Drive falhou: ${motivo}`)
      this.estadoSalvo.gravar({
        ...this.ler(),
        ultimoErro: {
          em: new Date().toISOString(),
          mensagem: `Backup salvo no computador, mas o envio ao Google Drive falhou: ${motivo}`,
        },
      })
    }
  }

  /** Backups guardados no computador e, se conectado, os do Drive. */
  async listar(): Promise<{
    local: ArquivoBackup[]
    drive: ArquivoBackup[] | null
    erroDrive: string | null
  }> {
    let drive: ArquivoBackup[] | null = null
    let erroDrive: string | null = null

    if (this.google.estado().conectado) {
      try {
        drive = (await this.drive.listar()).map(paraArquivoBackup)
      } catch (erro) {
        erroDrive = erro instanceof Error ? erro.message : String(erro)
      }
    }
    return { local: this.listarLocais(), drive, erroDrive }
  }

  listarLocais(): ArquivoBackup[] {
    if (!existsSync(this.config.backup.dir)) return []
    return readdirSync(this.config.backup.dir)
      .filter((nome) => PADRAO_BACKUP_LOCAL.test(nome))
      .map((nome) => {
        const info = statSync(join(this.config.backup.dir, nome))
        return { id: nome, nome, tamanho: info.size, criadoEm: info.mtime.toISOString() }
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }

  private async criarCopiaLocal(): Promise<{ arquivo: string; tamanho: number }> {
    mkdirSync(this.config.backup.dir, { recursive: true })
    const base = `brastem-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
    const temporario = join(this.config.backup.dir, `${base}.sqlite.tmp`)
    const destino = join(this.config.backup.dir, `${base}.sqlite.gz`)

    try {
      // A API de backup do SQLite copia páginas consistentes sem travar quem está usando o banco.
      await this.sqlite.backup(temporario)
      await pipeline(createReadStream(temporario), createGzip(), createWriteStream(destino))
    } finally {
      rmSync(temporario, { force: true })
    }
    return { arquivo: `${base}.sqlite.gz`, tamanho: statSync(destino).size }
  }

  private podarLocais() {
    // Pela data no nome do arquivo, não pela de modificação (que empata ou muda ao copiar a pasta).
    const antigos = this.listarLocais()
      .filter((item) => PADRAO_BACKUP.test(item.nome))
      .sort((a, b) => b.nome.localeCompare(a.nome))
      .slice(this.config.backup.retencaoLocal)
    for (const item of antigos) rmSync(join(this.config.backup.dir, item.nome), { force: true })
  }

  /** Mantém só os N mais recentes no Drive. Falha aqui não invalida o backup que acabou de subir. */
  private async podarDrive() {
    try {
      const antigos = (await this.drive.listar())
        .filter((item: ArquivoDrive) => PADRAO_BACKUP.test(item.nome))
        .slice(this.config.backup.retencaoDrive)
      for (const item of antigos) await this.drive.excluir(item.id)
    } catch (erro) {
      this.logger.warn(`Não consegui limpar backups antigos do Drive: ${erro}`)
    }
  }
}

const paraArquivoBackup = (item: ArquivoDrive): ArquivoBackup => ({
  id: item.id,
  nome: item.nome,
  tamanho: item.tamanho,
  criadoEm: item.criadoEm,
})
