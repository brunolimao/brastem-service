import { Module } from '@nestjs/common'
import { RelatoriosController } from './relatorios.controller.js'
import { RelatoriosService } from './relatorios.service.js'

@Module({
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
  // O Início (painel) usa o mesmo cálculo de faturamento.
  exports: [RelatoriosService],
})
export class RelatoriosModule {}
