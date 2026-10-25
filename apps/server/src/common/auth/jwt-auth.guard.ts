import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { ACCESS_COOKIE, type AccessPayload, type AuthenticatedRequest } from './auth.types.js'
import { IS_PUBLIC } from './decorators.js'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.[ACCESS_COOKIE]
    if (!token) throw new UnauthorizedException('Favor fazer o login!')

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token)
      request.user = { id: payload.sub, usuario: payload.usuario, role: payload.role }
      return true
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente')
    }
  }
}
