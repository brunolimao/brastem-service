import type { Periodo } from '@/libs/periodo'
import type { Caixa } from '@/models/caixa.model'
import type { PagamentoListado, ParcelaApi } from '@/models/pagamento.model'
import type { Pagina } from '@/models/pagina.model'
import type { Relatorio } from '@/models/relatorio.model'
import type { formParaPayloadTransacao } from '@/models/transacao.model'
import { api } from './api'

export interface BuscaPagamentos {
  campo?: string
  busca?: string
  tipo?: string
  inicio?: string
  fim?: string
  page?: number
}

export const financeiroService = {
  caixa: (periodo: Periodo) => api<Caixa>('/caixa', { query: { ...periodo } }),
  relatorio: (periodo: Periodo) => api<Relatorio>('/relatorios', { query: { ...periodo } }),
  pagamentos: ({ campo, tipo, ...resto }: BuscaPagamentos) =>
    api<Pagina<PagamentoListado>>('/pagamentos', {
      query: {
        ...resto,
        campo: campo === 'todos' ? undefined : campo,
        tipo: tipo === 'todos' ? undefined : tipo,
      },
    }),
  parcelas: (pagamentoId: number) => api<ParcelaApi[]>(`/pagamentos/${pagamentoId}/parcelas`),
  criarTransacao: (dados: ReturnType<typeof formParaPayloadTransacao>) =>
    api<{ id: number }>('/transacoes', { method: 'POST', body: dados }),
  removerTransacao: (id: number) => api<void>(`/transacoes/${id}`, { method: 'DELETE' }),
}
