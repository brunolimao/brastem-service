import type { Pagina } from '@/models/pagina.model'
import type { CriarUsuarioInput, Usuario } from '@/models/usuario.model'
import { api } from './api'

export const usuariosService = {
  listar: (page?: number) => api<Pagina<Usuario>>('/usuarios', { query: { page } }),
  criar: (dados: CriarUsuarioInput) => api<Usuario>('/usuarios', { method: 'POST', body: dados }),
  remover: (id: number) => api<void>(`/usuarios/${id}`, { method: 'DELETE' }),
}
