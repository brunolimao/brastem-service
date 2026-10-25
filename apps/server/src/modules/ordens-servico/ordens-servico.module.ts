import { Module } from '@nestjs/common'
import { PagamentosModule } from '../pagamentos/pagamentos.module.js'
import { OrdensServicoController } from './ordens-servico.controller.js'
import { OrdensServicoService } from './ordens-servico.service.js'

@Module({
  imports: [PagamentosModule],
  controllers: [OrdensServicoController],
  providers: [OrdensServicoService],
})
export class OrdensServicoModule {}
