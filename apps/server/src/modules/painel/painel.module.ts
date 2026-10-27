import { Module } from '@nestjs/common'
import { CaixaModule } from '../caixa/caixa.module.js'
import { RelatoriosModule } from '../relatorios/relatorios.module.js'
import { PainelController } from './painel.controller.js'
import { PainelService } from './painel.service.js'

@Module({
  imports: [RelatoriosModule, CaixaModule],
  controllers: [PainelController],
  providers: [PainelService],
})
export class PainelModule {}
