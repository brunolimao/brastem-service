import { Module } from '@nestjs/common'
import { PagamentosModule } from '../pagamentos/pagamentos.module.js'
import { TransacoesController } from './transacoes.controller.js'
import { TransacoesService } from './transacoes.service.js'

@Module({
  imports: [PagamentosModule],
  controllers: [TransacoesController],
  providers: [TransacoesService],
})
export class TransacoesModule {}
