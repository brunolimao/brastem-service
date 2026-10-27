import type {
  formParaPayloadOrdemServico,
  OrdemServicoDetalhe,
  OrdemServicoListada,
} from '@/models/ordem-servico.model'
import type { OpcoesDeLista, Pagina } from '@/models/pagina.model'
import { api } from './api'

export interface BuscaOrdens extends OpcoesDeLista {
  busca?: string
  campo?: string
  clienteId?: number
  aparelhoId?: number
}

type PayloadOrdem = ReturnType<typeof formParaPayloadOrdemServico>

export const ordensServicoService = {
  listar: ({ campo, ...resto }: BuscaOrdens) =>
    api<Pagina<OrdemServicoListada>>('/ordens-servico', {
      query: { ...resto, campo: campo === 'todos' ? undefined : campo },
    }),
  buscar: (id: number) => api<OrdemServicoDetalhe>(`/ordens-servico/${id}`),
  criar: (dados: PayloadOrdem & { clienteId: number; aparelhoId: number }) =>
    api<OrdemServicoDetalhe>('/ordens-servico', { method: 'POST', body: dados }),
  atualizar: (id: number, dados: PayloadOrdem) =>
    api<OrdemServicoDetalhe>(`/ordens-servico/${id}`, { method: 'PATCH', body: dados }),
  remover: (id: number) => api<void>(`/ordens-servico/${id}`, { method: 'DELETE' }),
}
