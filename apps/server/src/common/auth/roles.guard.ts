import type { Role } from '@brastem/shared'
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { AuthenticatedRequest } from './auth.types.js'
import { ROLES_KEY } from './decorators.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles?.length) return true

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Apenas administradores podem fazer isso')
    }
    return true
  }
}
