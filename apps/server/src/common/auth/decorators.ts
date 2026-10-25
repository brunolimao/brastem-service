import type { Role } from '@brastem/shared'
import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common'
import type { AuthenticatedRequest, AuthUser } from './auth.types.js'

export const IS_PUBLIC = 'isPublic'
export const ROLES_KEY = 'roles'

export const Public = () => SetMetadata(IS_PUBLIC, true)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user as AuthUser,
)
