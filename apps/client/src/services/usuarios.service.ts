import type { CriarUsuarioInput, Usuario } from '@/models/usuario.model'
import { api } from './api'

export const usuariosService = {
  listar: () => api<Usuario[]>('/usuarios'),
  criar: (dados: CriarUsuarioInput) => api<Usuario>('/usuarios', { method: 'POST', body: dados }),
  remover: (id: number) => api<void>(`/usuarios/${id}`, { method: 'DELETE' }),
}
