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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthUser } from '../../common/auth/auth.types.js'
import { CurrentUser, Roles } from '../../common/auth/decorators.js'
import { PaginacaoQueryDto } from '../../common/utils/pagination.js'
import { CreateUsuarioDto, UsuarioResponseDto } from './dto/usuario.dto.js'
import { UsuariosService } from './usuarios.service.js'

@ApiTags('usuarios')
@Roles('admin')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os usuários (paginado)' })
  list(@Query() query: PaginacaoQueryDto) {
    return this.usuarios.list(query)
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um usuário' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarios.create(dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um usuário' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    this.usuarios.remove(id, user.id)
  }
}
