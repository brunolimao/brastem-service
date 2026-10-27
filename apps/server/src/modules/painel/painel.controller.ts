import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthUser } from '../../common/auth/auth.types.js'
import { CurrentUser } from '../../common/auth/decorators.js'
import { PainelService } from './painel.service.js'

@ApiTags('painel')
@Controller('painel')
export class PainelController {
  constructor(private readonly painel: PainelService) {}

  // Qualquer usuário logado; o financeiro só vem para o administrador.
  @Get()
  @ApiOperation({
    summary: 'Resumo do Início: OS em andamento, do dia e do mês, e as mais paradas',
  })
  resumo(@CurrentUser() usuario: AuthUser) {
    return this.painel.resumo(usuario)
  }
}
