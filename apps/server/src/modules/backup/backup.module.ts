import { Module } from '@nestjs/common'
import { UsuariosModule } from '../usuarios/usuarios.module.js'
import { BackupAgendador } from './backup.agendador.js'
import { BackupController } from './backup.controller.js'
import { BackupService } from './backup.service.js'
import { GoogleDriveClient } from './google-drive.client.js'
import { GoogleOauthService } from './google-oauth.service.js'
import { RestauracaoService } from './restauracao.service.js'

@Module({
  imports: [UsuariosModule],
  controllers: [BackupController],
  providers: [
    BackupService,
    BackupAgendador,
    GoogleOauthService,
    GoogleDriveClient,
    RestauracaoService,
  ],
  exports: [BackupService],
})
export class BackupModule {}
