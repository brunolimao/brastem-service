import { Module } from '@nestjs/common'
import { PagamentosController } from './pagamentos.controller.js'
import { PagamentosService } from './pagamentos.service.js'

@Module({
  controllers: [PagamentosController],
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
