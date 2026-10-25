import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import {
  CreateOrdemServicoDto,
  OrdensServicoQueryDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto.js'
import { OrdensServicoService } from './ordens-servico.service.js'

@ApiTags('ordens-servico')
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordens: OrdensServicoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista e busca ordens de serviço (filtra por cliente ou aparelho)' })
  listar(@Query() query: OrdensServicoQueryDto) {
    return this.ordens.listar(query)
  }

  @Post()
  @ApiOperation({ summary: 'Gera uma ordem de serviço com seus pagamentos e parcelas' })
  criar(@Body() dto: CreateOrdemServicoDto) {
    return this.ordens.criar(dto)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'OS completa: cliente, aparelho, pagamentos e últimas 5 OS do aparelho',
  })
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.ordens.buscarPorId(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza a OS; se enviar pagamentos, eles substituem os atuais' })
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrdemServicoDto) {
    return this.ordens.atualizar(id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a OS com seus pagamentos e parcelas' })
  remover(@Param('id', ParseIntPipe) id: number) {
    this.ordens.remover(id)
  }
}
