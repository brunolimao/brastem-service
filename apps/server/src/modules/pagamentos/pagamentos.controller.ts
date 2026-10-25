import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { PagamentosQueryDto } from './dto/pagamento.dto.js'
import { PagamentosService } from './pagamentos.service.js'

@ApiTags('pagamentos')
@Roles('admin')
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get()
  @ApiOperation({ summary: 'Busca pagamentos (período, forma e campo)' })
  listar(@Query() query: PagamentosQueryDto) {
    return this.pagamentos.listar(query)
  }

  @Get(':id/parcelas')
  @ApiOperation({ summary: 'Parcelas de um pagamento' })
  parcelas(@Param('id', ParseIntPipe) id: number) {
    return this.pagamentos.parcelasDe(id)
  }
}
