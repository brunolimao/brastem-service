import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { CaixaService } from './caixa.service.js'
import { CaixaQueryDto } from './dto/caixa.dto.js'

@ApiTags('caixa')
@Roles('admin')
@Controller('caixa')
export class CaixaController {
  constructor(private readonly caixa: CaixaService) {}

  @Get()
  @ApiOperation({ summary: 'Entradas e saídas do período, paginadas (sem datas, usa hoje)' })
  consultar(@Query() query: CaixaQueryDto) {
    return this.caixa.consultar(query)
  }
}
