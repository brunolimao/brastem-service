import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { PeriodoQueryDto } from '../../common/utils/pagination.js'
import { RelatoriosService } from './relatorios.service.js'

@ApiTags('relatorios')
@Roles('admin')
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatorios: RelatoriosService) {}

  @Get()
  @ApiOperation({ summary: 'Indicadores e distribuições do período (sem datas, usa hoje)' })
  gerar(@Query() query: PeriodoQueryDto) {
    return this.relatorios.gerar(query)
  }
}
