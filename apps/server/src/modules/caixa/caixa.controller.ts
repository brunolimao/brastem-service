import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { PeriodoQueryDto } from '../../common/utils/pagination.js'
import { CaixaService } from './caixa.service.js'

@ApiTags('caixa')
@Roles('admin')
@Controller('caixa')
export class CaixaController {
  constructor(private readonly caixa: CaixaService) {}

  @Get()
  @ApiOperation({ summary: 'Entradas e saídas do período (sem datas, usa hoje)' })
  consultar(@Query() query: PeriodoQueryDto) {
    return this.caixa.consultar(query)
  }
}
