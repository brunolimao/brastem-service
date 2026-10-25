import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/auth/decorators.js'
import { CreateTransacaoDto, TransacoesQueryDto } from './dto/transacao.dto.js'
import { TransacoesService } from './transacoes.service.js'

@ApiTags('transacoes')
@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoes: TransacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Lança uma receita ou despesa avulsa' })
  criar(@Body() dto: CreateTransacaoDto) {
    return this.transacoes.criar(dto)
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Lista receitas e despesas' })
  listar(@Query() query: TransacoesQueryDto) {
    return this.transacoes.listar(query)
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a transação e seus pagamentos' })
  remover(@Param('id', ParseIntPipe) id: number) {
    this.transacoes.remover(id)
  }
}
