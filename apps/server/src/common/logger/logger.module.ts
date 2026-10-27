import { join } from 'node:path'
import { type ConfigType } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { appConfig } from '../config/app.config.js'

/** Senha e cookies nunca vão para o registro (R-SEG-11). */
export const CAMPOS_OCULTOS_NO_LOG = [
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.senha',
]

/** A query pode trazer segredo (o `code` do retorno do Google): o log guarda só o caminho (R-SEG-11). */
export const requisicaoParaLog = <T extends { url?: string; query?: unknown }>(req: T) => ({
  ...req,
  url: req.url?.split('?')[0],
  query: undefined,
})

export const AppLoggerModule = LoggerModule.forRootAsync({
  inject: [appConfig.KEY],
  useFactory: (config: ConfigType<typeof appConfig>) => {
    const target = config.isProduction
      ? {
          target: 'pino-roll',
          level: config.logLevel,
          options: {
            file: join(config.logsDir, 'app'),
            frequency: 'daily',
            extension: '.log',
            mkdir: true,
            limit: { count: 14 },
          },
        }
      : {
          target: 'pino-pretty',
          level: config.logLevel,
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
        }

    return {
      pinoHttp: {
        level: config.logLevel,
        transport: config.isTest ? undefined : { targets: [target] },
        redact: CAMPOS_OCULTOS_NO_LOG,
        serializers: { req: requisicaoParaLog },
      },
    }
  },
})
