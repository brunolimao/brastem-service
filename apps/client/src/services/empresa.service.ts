import type { Empresa, EmpresaForm } from '@/models/empresa.model'
import { api } from './api'

export const empresaService = {
  obter: () => api<Empresa>('/empresa'),
  salvar: (dados: EmpresaForm) => api<Empresa>('/empresa', { method: 'PUT', body: dados }),
}
