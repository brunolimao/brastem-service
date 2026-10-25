import type { TipoPagamento } from '@brastem/shared'
import type { Periodo } from '@/libs/periodo'

export interface ItemCaixa {
  id: number
  /** Centavos; negativo é saída (despesa). */
  valor: number
  data: string
  numero: number
  totalParcelas: number
  tipo: TipoPagamento
  observacao: string
  pagamentoId: number
  ordemServicoId: number | null
  clienteId: number | null
  aparelhoId: number | null
  transacaoId: number | null
  categoria: string | null
  descricao: string | null
}

export interface Caixa {
  periodo: Periodo
  total: number
  formas: Record<TipoPagamento, number>
  itens: ItemCaixa[]
}

/** "À vista" ou "2/3". */
export const rotuloParcela = (item: Pick<ItemCaixa, 'numero' | 'totalParcelas'>) =>
  item.totalParcelas === 0 ? 'À vista' : `${item.numero}/${item.totalParcelas}`
