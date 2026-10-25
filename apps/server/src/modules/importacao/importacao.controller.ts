import { Controller, HttpCode, Post, Req } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { Public } from '../../common/auth/decorators.js'
import { ImportacaoService } from './importacao.service.js'

@ApiTags('importacao')
@Controller('import')
export class ImportacaoController {
  constructor(private readonly importacao: ImportacaoService) {}

  // Pública porque acontece antes de existir qualquer usuário; o serviço recusa se já houver.
  @Public()
  @Post('legacy')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Importa o dump .sql do sistema antigo (só antes do primeiro usuário)' })
  @ApiConsumes('application/octet-stream')
  @ApiBody({ schema: { type: 'string', format: 'binary' } })
  importarLegado(@Req() req: Request) {
    // O corpo chega cru (Buffer): ver `express.raw` no bootstrap.
    return this.importacao.importarLegado(req.body as Buffer)
  }
}
