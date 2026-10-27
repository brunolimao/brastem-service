import { Body, Controller, Delete, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { Public, Roles } from '../../common/auth/decorators.js'
import { BackupService } from './backup.service.js'
import { CredenciaisGoogleDto, RestaurarDto } from './dto/backup.dto.js'
import { GoogleOauthService } from './google-oauth.service.js'
import { RestauracaoService } from './restauracao.service.js'

const escapar = (texto: string) =>
  texto.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )

const paginaDeRetorno = (titulo: string, mensagem: string) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brastem-Service</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
main{max-width:420px;text-align:center}h1{font-size:1.4rem}p{color:#9ca3af;line-height:1.5}</style></head>
<body><main><h1>${escapar(titulo)}</h1><p>${escapar(mensagem)}</p></main></body></html>`

@ApiTags('backup')
@Roles('admin')
@Controller('backup')
export class BackupController {
  constructor(
    private readonly backup: BackupService,
    private readonly google: GoogleOauthService,
    private readonly restauracao: RestauracaoService,
  ) {}

  @Get('estado')
  @ApiOperation({ summary: 'Situação do backup e da conexão com o Google Drive' })
  estado() {
    return this.backup.estado()
  }

  @Get('arquivos')
  @ApiOperation({ summary: 'Backups no computador e no Google Drive' })
  arquivos() {
    return this.backup.listar()
  }

  @Post('executar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Faz um backup agora' })
  executar() {
    return this.backup.executar('manual')
  }

  @Post('restaurar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Prepara a restauração de um backup (o banco é trocado na próxima abertura)',
  })
  restaurar(@Body() dto: RestaurarDto) {
    return this.restauracao.preparar(dto.origem, dto.id)
  }

  @Post('restaurar/arquivo')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Prepara a restauração de um arquivo de backup enviado pelo usuário' })
  @ApiConsumes('application/octet-stream')
  @ApiBody({ schema: { type: 'string', format: 'binary' } })
  restaurarDeArquivo(@Req() req: Request) {
    // O corpo chega cru (Buffer): ver `express.raw` no bootstrap.
    return this.restauracao.prepararDeArquivo(req.body)
  }

  @Post('google/credenciais')
  @HttpCode(204)
  @ApiOperation({ summary: 'Guarda o Client ID e o Client Secret do app criado no Google Cloud' })
  salvarCredenciais(@Body() dto: CredenciaisGoogleDto) {
    this.google.salvarCredenciais(dto.clientId.trim(), dto.clientSecret.trim())
  }

  @Get('google/conectar')
  @ApiOperation({ summary: 'Endereço do Google para o usuário autorizar o acesso ao Drive' })
  conectar() {
    return { url: this.google.gerarUrlDeAutorizacao() }
  }

  @Delete('google')
  @HttpCode(204)
  @ApiOperation({ summary: 'Desconecta o Google Drive' })
  async desconectar() {
    await this.google.desconectar()
  }

  // O Google redireciona o navegador para cá, sem o cookie de login: quem protege é o `state` de uso único.
  @Public()
  @Get('google/callback')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Retorno da autorização do Google (uso interno)' })
  async retorno(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') erro: string | undefined,
    @Res() res: Response,
  ) {
    res.type('html')
    if (erro || !code || !state) {
      res
        .status(400)
        .send(
          paginaDeRetorno(
            'Não foi possível conectar',
            'A autorização foi cancelada. Volte ao Brastem-Service e tente de novo.',
          ),
        )
      return
    }

    try {
      await this.google.concluirAutorizacao(code, state)
      res.send(
        paginaDeRetorno(
          'Google Drive conectado!',
          'Pode fechar esta aba e voltar ao Brastem-Service.',
        ),
      )
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Tente conectar de novo.'
      res.status(400).send(paginaDeRetorno('Não foi possível conectar', mensagem))
    }
  }
}
