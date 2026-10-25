import type { Role } from '@brastem/shared'
import type { Request } from 'express'

export interface AuthUser {
  id: number
  usuario: string
  role: Role
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export interface AccessPayload {
  sub: number
  usuario: string
  role: Role
}

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'
