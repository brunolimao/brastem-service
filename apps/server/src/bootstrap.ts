import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { type INestApplication } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import type { NextFunction, Request, Response } from 'express'
import { raw } from 'express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import { ACCESS_COOKIE } from './common/auth/auth.types.js'
import { appConfig } from './common/config/app.config.js'
import { acessoLocal } from './common/http/acesso-local.js'
import { createValidationPipe } from './common/validation/messages.js'
import { MENSAGEM_RESTAURACAO_INICIAL } from './modules/backup/restauracao.service.js'
import { UsuariosService } from './modules/usuarios/usuarios.service.js'

/** Limite do arquivo .sql do sistema antigo (o real tem ~5 MB). */
const LIMITE_IMPORTACAO = '200mb'

/** Configura (sem escutar) a aplicação. Usado pelo main, pelo app desktop e pelos testes e2e. */
export async function createApp(): Promise<INestApplication> {
  // Sem o bodyParser padrão: ele também aceita formulários (urlencoded), que um site consegue enviar
  // para 127.0.0.1 sem o navegador pedir permissão. A API só fala JSON.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
    // Por padrão o Nest encerra o processo (process.exit) se algo falha ao iniciar. No app desktop o
    // processo é o próprio Electron: ele fechava sem aviso. Assim o erro volta para quem chamou, e o
    // Electron mostra a tela de erro com "Procurar atualização".
    abortOnError: false,
  })
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)

  app.useLogger(app.get(Logger))
  app.use(
    helmet({
      // O app roda em http://127.0.0.1, então nada de HSTS nem de forçar https.
      hsts: false,
      // O Swagger precisa de scripts inline; em produção (sem Swagger) a política é estrita.
      contentSecurityPolicy: config.isProduction
        ? {
            useDefaults: false,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              fontSrc: ["'self'", 'data:'],
              // ViaCEP preenche o endereço pelo CEP.
              connectSrc: ["'self'", 'https://viacep.com.br'],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false,
    }),
  )
  app.use(acessoLocal)
  app.use(cookieParser())
  app.useBodyParser('json', { limit: '1mb' })
  // O arquivo importado chega como bytes crus, não como JSON (só com o tipo que o front usa).
  const usuarios = app.get(UsuariosService)
  // Rotas sem login do primeiro uso: depois do primeiro usuário são recusadas sem nem receber o
  // arquivo (até 200 MB).
  const soNoPrimeiroUso =
    (mensagem: string) => (_req: Request, res: Response, next: NextFunction) => {
      if (usuarios.total() === 0) return next()
      res.status(403).json({ statusCode: 403, message: mensagem })
    }
  app.use(
    '/api/import/legacy',
    soNoPrimeiroUso('A importação só pode ser feita no primeiro uso, antes de criar usuários.'),
    raw({ type: 'application/octet-stream', limit: LIMITE_IMPORTACAO }),
  )
  app.use(
    '/api/backup/restaurar/inicial',
    soNoPrimeiroUso(MENSAGEM_RESTAURACAO_INICIAL),
    raw({ type: 'application/octet-stream', limit: LIMITE_IMPORTACAO }),
  )
  // Backup escolhido pelo usuário para restaurar (só administrador: o guard confere na rota).
  app.use(
    '/api/backup/restaurar/arquivo',
    raw({ type: 'application/octet-stream', limit: LIMITE_IMPORTACAO }),
  )
  app.setGlobalPrefix('api')
  app.useGlobalPipes(createValidationPipe())
  app.enableShutdownHooks()

  if (config.clientDir) servirInterface(app, config.clientDir)

  if (config.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Brastem-Service API')
        .setVersion('2.0')
        .addCookieAuth(ACCESS_COOKIE)
        .build(),
    )
    SwaggerModule.setup('docs', app, document)
  }

  return app
}

/** Entrega o front compilado; rotas do front (ex.: /clientes/3) caem no index.html. */
function servirInterface(app: NestExpressApplication, pasta: string) {
  if (!existsSync(join(pasta, 'index.html'))) {
    throw new Error(`CLIENT_DIR sem index.html: ${pasta}`)
  }

  app.useStaticAssets(pasta, { index: false })
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ehPaginaDoFront =
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.startsWith('/docs') &&
      extname(req.path) === ''
    // `root` evita que uma pasta com ponto no caminho (ex.: .stage) seja tratada como arquivo oculto.
    if (ehPaginaDoFront) res.sendFile('index.html', { root: pasta }, (erro) => erro && next(erro))
    else next()
  })
}

export async function bootstrap() {
  const app = await createApp()
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)
  await app.listen(config.port, config.host)
  return app
}
