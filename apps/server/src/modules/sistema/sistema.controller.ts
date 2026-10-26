import { Controller, Get, Inject } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/auth/decorators.js'
import { appConfig } from '../../common/config/app.config.js'

@ApiTags('sistema')
@Controller('sistema')
export class SistemaController {
  constructor(@Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>) {}

  // Público: a versão aparece no menu e serve para o suporte, mesmo antes do login.
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Versão do sistema (ex.: "2.1.0"; "desenvolvimento" fora do app instalado)',
  })
  informacoes() {
    return { versao: this.config.versao }
  }
}
