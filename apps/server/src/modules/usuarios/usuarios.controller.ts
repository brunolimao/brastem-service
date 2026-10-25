import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthUser } from '../../common/auth/auth.types.js'
import { CurrentUser, Roles } from '../../common/auth/decorators.js'
import { CreateUsuarioDto, UsuarioResponseDto } from './dto/usuario.dto.js'
import { UsuariosService } from './usuarios.service.js'

@ApiTags('usuarios')
@Roles('admin')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os usuários' })
  @ApiOkResponse({ type: [UsuarioResponseDto] })
  list() {
    return this.usuarios.list()
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
