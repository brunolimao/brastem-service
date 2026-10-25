import type { ClienteDetalhe, ClienteListado, formParaPayloadCliente } from '@/models/cliente.model'
import type { Pagina } from '@/models/pagina.model'
import { api } from './api'

export interface BuscaClientes {
  busca?: string
  campo?: string
  page?: number
}

type PayloadCliente = ReturnType<typeof formParaPayloadCliente>

export const clientesService = {
  listar: ({ busca, campo, page }: BuscaClientes) =>
    api<Pagina<ClienteListado>>('/clientes', {
      query: { busca, campo: campo === 'todos' ? undefined : campo, page },
    }),
  buscar: (id: number) => api<ClienteDetalhe>(`/clientes/${id}`),
  criar: (dados: PayloadCliente) =>
    api<ClienteDetalhe>('/clientes', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: PayloadCliente) =>
    api<ClienteDetalhe>(`/clientes/${id}`, { method: 'PATCH', body: dados }),
  remover: (id: number) => api<void>(`/clientes/${id}`, { method: 'DELETE' }),
}
