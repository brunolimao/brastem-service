import { join } from 'node:path'
import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const dataDir = process.env.DATA_DIR ?? './data'

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(process.env.PORT ?? 3333),
    host: process.env.HOST ?? '127.0.0.1',
    dataDir,
    databaseFile: nodeEnv === 'test' ? ':memory:' : join(dataDir, 'brastem.sqlite'),
    clientDir: process.env.CLIENT_DIR || undefined,
    logsDir: join(dataDir, 'logs'),
    logLevel: nodeEnv === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false' && nodeEnv !== 'production',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    backup: {
      dir: join(dataDir, 'backups'),
      integracoesDir: join(dataDir, 'integracoes'),
      intervaloHoras: 24,
      retencaoLocal: 7,
      retencaoDrive: 30,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || undefined,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || undefined,
    },
    jwt: {
      secret: process.env.JWT_SECRET as string,
      accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_MIN ?? 15) * 60,
      refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 7),
    },
  }
})

export type AppConfig = ReturnType<typeof appConfig>
