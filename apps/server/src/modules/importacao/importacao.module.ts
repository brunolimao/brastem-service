import { Module } from '@nestjs/common'
import { UsuariosModule } from '../usuarios/usuarios.module.js'
import { ImportacaoController } from './importacao.controller.js'
import { ImportacaoService } from './importacao.service.js'

@Module({
  imports: [UsuariosModule],
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
})
export class ImportacaoModule {}
