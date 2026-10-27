import type { Painel } from '@/models/painel.model'
import { api } from './api'

export const painelService = {
  resumo: () => api<Painel>('/painel'),
}
