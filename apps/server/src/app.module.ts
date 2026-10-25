import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { appConfig } from './common/config/app.config.js'
import { envValidationSchema } from './common/config/env.validation.js'
import { DatabaseModule } from './common/database/database.module.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { AppLoggerModule } from './common/logger/logger.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { BackupModule } from './modules/backup/backup.module.js'
import { CaixaModule } from './modules/caixa/caixa.module.js'
import { ClientesModule } from './modules/clientes/clientes.module.js'
import { ImportacaoModule } from './modules/importacao/importacao.module.js'
import { OrdensServicoModule } from './modules/ordens-servico/ordens-servico.module.js'
import { PagamentosModule } from './modules/pagamentos/pagamentos.module.js'
import { RelatoriosModule } from './modules/relatorios/relatorios.module.js'
import { TransacoesModule } from './modules/transacoes/transacoes.module.js'
import { UsuariosModule } from './modules/usuarios/usuarios.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    AppLoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    OrdensServicoModule,
    PagamentosModule,
    TransacoesModule,
    CaixaModule,
    RelatoriosModule,
    ImportacaoModule,
    BackupModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
