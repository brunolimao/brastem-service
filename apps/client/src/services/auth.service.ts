import type { LoginInput, SessaoUsuario } from '@/models/auth.model'
import { api } from './api'

export const authService = {
  login: (dados: LoginInput) => api<SessaoUsuario>('/auth/login', { method: 'POST', body: dados }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
  me: () => api<SessaoUsuario>('/auth/me'),
  precisaConfigurar: () => api<{ needsSetup: boolean }>('/auth/setup'),
  configurar: (dados: { usuario: string; senha: string }) =>
    api<{ ok: true }>('/auth/setup', { method: 'POST', body: dados }),
}
