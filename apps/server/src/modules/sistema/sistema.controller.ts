import { Controller, Get, HttpCode, Inject, Post, StreamableFile } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public, Roles } from '../../common/auth/decorators.js'
import { appConfig } from '../../common/config/app.config.js'
import { DiagnosticoService } from './diagnostico.service.js'

/** Evento que o app desktop escuta para procurar atualização (como o menu Ajuda). */
export const EVENTO_PROCURAR_ATUALIZACAO = 'brastem:procurar-atualizacao'

@ApiTags('sistema')
@Controller('sistema')
export class SistemaController {
  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly diagnostico: DiagnosticoService,
  ) {}

  // Público: a versão aparece no menu e serve para o suporte, mesmo antes do login.
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Versão do sistema (ex.: "2.1.0"; "desenvolvimento" fora do app instalado)',
  })
  informacoes() {
    return { versao: this.config.versao }
  }

  /**
   * Botão "Procurar atualização" do menu: o app desktop (mesmo processo) escuta o evento e faz o mesmo
   * que Ajuda → Verificar atualizações, respondendo numa janela. Fora dele ninguém escuta.
   */
  @Post('procurar-atualizacao')
  @HttpCode(202)
  @ApiOperation({ summary: 'Pede ao app desktop para procurar uma versão nova agora' })
  procurarAtualizacao() {
    return { iniciado: (process as NodeJS.EventEmitter).emit(EVENTO_PROCURAR_ATUALIZACAO) }
  }

  /** Botão "Gerar diagnóstico" de Configurações: o .zip que o administrador manda para o suporte. */
  @Roles('admin')
  @Get('diagnostico')
  @ApiOperation({ summary: 'Pacote de diagnóstico para o suporte (.zip, sem dados de clientes)' })
  gerarDiagnostico() {
    const data = new Date().toISOString().slice(0, 10)
    return new StreamableFile(this.diagnostico.gerar(), {
      type: 'application/zip',
      disposition: `attachment; filename="diagnostico-brastem-${data}.zip"`,
    })
  }
}
