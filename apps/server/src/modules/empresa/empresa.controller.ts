import { Body, Controller, Get, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { EmpresaDto } from './dto/empresa.dto.js'
import { EmpresaService } from './empresa.service.js'

@ApiTags('empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresa: EmpresaService) {}

  @Get()
  @ApiOperation({ summary: 'Dados da empresa para o cabeçalho da impressão da OS' })
  obter() {
    return this.empresa.obter()
  }

  @Put()
  @Roles('admin')
  @ApiOperation({ summary: 'Salva os dados da empresa' })
  salvar(@Body() dto: EmpresaDto) {
    return this.empresa.salvar(dto)
  }
}
