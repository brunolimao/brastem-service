import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { eq } from 'drizzle-orm'
import { type Db, DRIZZLE } from '../database/database.module.js'
import { usuarios } from '../database/schema/index.js'
import { ACCESS_COOKIE, type AccessPayload, type AuthenticatedRequest } from './auth.types.js'
import { IS_PUBLIC } from './decorators.js'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(DRIZZLE) private readonly db: Db,
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

    let payload: AccessPayload
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(token)
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente')
    }

    // O token vale 15 min, mas quem foi excluído ou desativado perde o acesso na hora, e o papel
    // (admin/usuário) é sempre o atual. Consulta pela chave primária: custo desprezível.
    const atual = this.db
      .select({
        id: usuarios.id,
        usuario: usuarios.usuario,
        role: usuarios.role,
        ativo: usuarios.ativo,
      })
      .from(usuarios)
      .where(eq(usuarios.id, payload.sub))
      .get()
    if (!atual?.ativo) throw new UnauthorizedException('Sessão expirada. Faça login novamente')
    request.user = { id: atual.id, usuario: atual.usuario, role: atual.role }
    return true
  }
}
