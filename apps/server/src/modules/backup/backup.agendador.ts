import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { appConfig } from '../../common/config/app.config.js'
import { BackupService } from './backup.service.js'

const UMA_HORA_MS = 60 * 60 * 1000
/** Dá tempo do app terminar de abrir antes do primeiro backup. */
const ATRASO_INICIAL_MS = 60 * 1000

/**
 * Verifica de hora em hora se está na hora do backup. Um relógio fixo (cron) falharia num PC que
 * fica desligado à noite; assim o backup acontece na primeira oportunidade depois de ligar.
 */
@Injectable()
export class BackupAgendador implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(BackupAgendador.name)
  private temporizadores: NodeJS.Timeout[] = []

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly backup: BackupService,
  ) {}

  onApplicationBootstrap() {
    if (this.config.isTest) return
    this.temporizadores = [
      setTimeout(() => void this.verificar(), ATRASO_INICIAL_MS),
      setInterval(() => void this.verificar(), UMA_HORA_MS),
    ]
    // Não segurar o processo aberto só por causa do agendador.
    for (const temporizador of this.temporizadores) temporizador.unref()
  }

  onApplicationShutdown() {
    for (const temporizador of this.temporizadores) clearTimeout(temporizador)
  }

  private async verificar() {
    try {
      await this.backup.executarSeNecessario()
    } catch (erro) {
      this.logger.error(`Backup automático falhou: ${erro instanceof Error ? erro.message : erro}`)
    }
  }
}
