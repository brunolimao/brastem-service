import type { ClienteDetalhe, ClienteListado, formParaPayloadCliente } from '@/models/cliente.model'
import type { OpcoesDeLista, Pagina } from '@/models/pagina.model'
import { api } from './api'

export interface BuscaClientes extends OpcoesDeLista {
  busca?: string
  campo?: string
}

type PayloadCliente = ReturnType<typeof formParaPayloadCliente>

export const clientesService = {
  listar: ({ campo, ...resto }: BuscaClientes) =>
    api<Pagina<ClienteListado>>('/clientes', {
      query: { ...resto, campo: campo === 'todos' ? undefined : campo },
    }),
  buscar: (id: number) => api<ClienteDetalhe>(`/clientes/${id}`),
  criar: (dados: PayloadCliente) =>
    api<ClienteDetalhe>('/clientes', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: PayloadCliente) =>
    api<ClienteDetalhe>(`/clientes/${id}`, { method: 'PATCH', body: dados }),
  remover: (id: number) => api<void>(`/clientes/${id}`, { method: 'DELETE' }),
}
