import { Module } from '@nestjs/common'
import { CaixaController } from './caixa.controller.js'
import { CaixaService } from './caixa.service.js'

@Module({
  controllers: [CaixaController],
  providers: [CaixaService],
  // O Início (painel) usa o mesmo saldo do caixa.
  exports: [CaixaService],
})
export class CaixaModule {}
