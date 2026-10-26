import { api } from './api'

export const sistemaService = {
  informacoes: () => api<{ versao: string }>('/sistema'),
}
