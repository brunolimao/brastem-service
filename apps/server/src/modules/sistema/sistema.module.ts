import { Module } from '@nestjs/common'
import { BackupModule } from '../backup/backup.module.js'
import { DiagnosticoService } from './diagnostico.service.js'
import { SistemaController } from './sistema.controller.js'

@Module({
  imports: [BackupModule],
  controllers: [SistemaController],
  providers: [DiagnosticoService],
})
export class SistemaModule {}
