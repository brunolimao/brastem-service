import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGunzip } from 'node:zlib'
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import Database from 'better-sqlite3'
import { appConfig } from '../../common/config/app.config.js'
import { NOME_RESTAURACAO_PENDENTE } from '../../common/database/connection.js'
import { GoogleDriveClient } from './google-drive.client.js'

/** Evento que o app desktop escuta para reiniciar sozinho depois de preparar uma restauração. */
export const EVENTO_REINICIAR = 'brastem:reiniciar'

const TABELAS_OBRIGATORIAS = ['usuarios', 'clientes', 'ordens_servico', 'pagamentos', 'parcelas']
const NOME_LOCAL_VALIDO = /^(brastem|antes-da-restauracao)-[\w-]+\.sqlite(\.gz)?$/
const ID_DRIVE_VALIDO = /^[\w-]{10,120}$/

export type OrigemRestauracao = 'local' | 'drive'

@Injectable()
export class RestauracaoService {
  private readonly logger = new Logger(RestauracaoService.name)

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly drive: GoogleDriveClient,
  ) {}

  /**
   * Deixa o backup escolhido pronto para entrar no lugar do banco na próxima abertura do app.
   * O banco em uso não é tocado agora: ver `aplicarRestauracaoPendente`.
   * Devolve se o app vai reiniciar sozinho (app desktop) ou se o usuário precisa reabri-lo.
   */
  async preparar(origem: OrigemRestauracao, id: string): Promise<{ reiniciando: boolean }> {
    const pasta = this.config.dataDir
    mkdirSync(pasta, { recursive: true })

    const extraido = join(pasta, `${NOME_RESTAURACAO_PENDENTE}.tmp`)
    const baixado = join(pasta, 'restauracao-baixada.tmp')
    try {
      const compactado = await this.obterArquivo(origem, id, baixado)
      await this.extrair(compactado.caminho, extraido, compactado.gzip)
      this.validar(extraido)
      renameSync(extraido, join(pasta, NOME_RESTAURACAO_PENDENTE))
    } finally {
      // Abrir o arquivo (mesmo só para ler) faz o SQLite criar auxiliares -wal/-shm ao lado dele.
      for (const sufixo of ['', '-wal', '-shm']) rmSync(extraido + sufixo, { force: true })
      rmSync(baixado, { force: true })
    }

    this.logger.warn('Restauração preparada: o banco será trocado na próxima abertura do app.')
    // `process` serve de barramento simples: o Electron escuta este evento; fora dele, ninguém escuta.
    const reiniciando = (process as NodeJS.EventEmitter).emit(EVENTO_REINICIAR)
    return { reiniciando }
  }

  private async obterArquivo(
    origem: OrigemRestauracao,
    id: string,
    temporario: string,
  ): Promise<{ caminho: string; gzip: boolean }> {
    if (origem === 'drive') {
      if (!ID_DRIVE_VALIDO.test(id)) throw new BadRequestException('Backup do Drive inválido.')
      writeFileSync(temporario, await this.drive.baixar(id))
      return { caminho: temporario, gzip: true }
    }

    // Só o nome do arquivo, nunca um caminho: impede sair da pasta de backups.
    if (basename(id) !== id || !NOME_LOCAL_VALIDO.test(id)) {
      throw new BadRequestException('Nome de backup inválido.')
    }
    const caminho = join(this.config.backup.dir, id)
    if (!existsSync(caminho)) throw new NotFoundException('Backup não encontrado.')
    return { caminho, gzip: id.endsWith('.gz') }
  }

  private async extrair(origem: string, destino: string, gzip: boolean) {
    try {
      const leitura = createReadStream(origem)
      if (gzip) await pipeline(leitura, createGunzip(), createWriteStream(destino))
      else await pipeline(leitura, createWriteStream(destino))
    } catch {
      throw new BadRequestException(
        'Este arquivo não é um backup válido (não consegui descompactar).',
      )
    }
  }

  /** Só aceita um banco SQLite íntegro que tenha as tabelas do Brastem-Service. */
  private validar(caminho: string) {
    const invalido = new BadRequestException(
      'Este arquivo não é um backup válido do Brastem-Service.',
    )
    let banco: Database.Database | undefined
    try {
      banco = new Database(caminho, { readonly: true, fileMustExist: true })
      const integridade = banco.pragma('integrity_check', { simple: true })
      if (integridade !== 'ok') throw invalido

      const tabelas = new Set(
        (
          banco.prepare("select name from sqlite_master where type = 'table'").all() as {
            name: string
          }[]
        ).map((linha) => linha.name),
      )
      if (!TABELAS_OBRIGATORIAS.every((tabela) => tabelas.has(tabela))) throw invalido
    } catch (erro) {
      if (erro === invalido) throw erro
      throw invalido
    } finally {
      banco?.close()
    }
  }
}
