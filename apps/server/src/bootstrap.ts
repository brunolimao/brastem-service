import { type INestApplication } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import { ACCESS_COOKIE } from './common/auth/auth.types.js'
import { appConfig } from './common/config/app.config.js'
import { createValidationPipe } from './common/validation/messages.js'

/** Configura (sem escutar) a aplicação. Usado pelo main e pelos testes e2e. */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)

  app.useLogger(app.get(Logger))
  app.use(helmet())
  app.use(cookieParser())
  app.setGlobalPrefix('api')
  app.useGlobalPipes(createValidationPipe())
  app.enableShutdownHooks()

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

export async function bootstrap() {
  const app = await createApp()
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)
  await app.listen(config.port, config.host)
  return app
}
