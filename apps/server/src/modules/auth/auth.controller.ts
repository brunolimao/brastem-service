import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { CookieOptions, Request, Response } from 'express'
import { ACCESS_COOKIE, type AuthUser, REFRESH_COOKIE } from '../../common/auth/auth.types.js'
import { CurrentUser, Public } from '../../common/auth/decorators.js'
import { appConfig } from '../../common/config/app.config.js'
import { AuthService, type Session } from './auth.service.js'
import { LoginDto, SetupDto } from './dto/auth.dto.js'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  @Public()
  @Get('setup')
  @ApiOperation({ summary: 'Informa se ainda é preciso criar o primeiro administrador' })
  setupStatus() {
    return { needsSetup: this.auth.needsSetup() }
  }

  @Public()
  @Post('setup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cria o primeiro administrador (só funciona com o banco sem usuários)' })
  async setup(@Body() dto: SetupDto) {
    await this.auth.setup(dto.usuario, dto.senha)
    return { ok: true }
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Entra no sistema (define cookies httpOnly)' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto.usuario, dto.senha)
    this.setCookies(res, session)
    return session.user
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renova a sessão usando o refresh token do cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE])
    this.setCookies(res, session)
    return session.user
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Sai do sistema' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.auth.logout(req.cookies?.[REFRESH_COOKIE])
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions('/api'))
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions('/api/auth'))
  }

  @Get('me')
  @ApiOperation({ summary: 'Dados do usuário logado' })
  me(@CurrentUser() user: AuthUser) {
    return user
  }

  private cookieOptions(path: string): CookieOptions {
    return { httpOnly: true, sameSite: 'strict', secure: this.config.cookieSecure, path }
  }

  private setCookies(res: Response, session: Session) {
    res.cookie(ACCESS_COOKIE, session.accessToken, {
      ...this.cookieOptions('/api'),
      maxAge: this.config.jwt.accessTtlSeconds * 1000,
    })
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...this.cookieOptions('/api/auth'),
      maxAge: this.config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
    })
  }
}
