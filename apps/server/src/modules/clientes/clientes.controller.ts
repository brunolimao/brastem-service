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
import { ClientesService } from './clientes.service.js'
import { ClientesQueryDto, CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto.js'

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista e busca clientes (paginado)' })
  listar(@Query() query: ClientesQueryDto) {
    return this.clientes.listar(query)
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra cliente com telefones e aparelhos' })
  criar(@Body() dto: CreateClienteDto) {
    return this.clientes.criar(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Cliente com telefones e aparelhos' })
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.buscarPorId(id)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza cliente; telefones e aparelhos são enviados como lista final',
  })
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
    return this.clientes.atualizar(id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove o cliente e tudo que depende dele (aparelhos, OS, pagamentos)' })
  remover(@Param('id', ParseIntPipe) id: number) {
    this.clientes.remover(id)
  }
}
