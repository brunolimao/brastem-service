import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Periodo } from '@/libs/periodo'
import { type BuscaPagamentos, financeiroService } from '@/services/financeiro.service'

export const useCaixa = (periodo: Periodo) =>
  useQuery({
    queryKey: ['caixa', periodo],
    queryFn: () => financeiroService.caixa(periodo),
    placeholderData: keepPreviousData,
  })

export const useRelatorio = (periodo: Periodo) =>
  useQuery({
    queryKey: ['relatorio', periodo],
    queryFn: () => financeiroService.relatorio(periodo),
    placeholderData: keepPreviousData,
  })

export const usePagamentos = (busca: BuscaPagamentos) =>
  useQuery({
    queryKey: ['pagamentos', busca],
    queryFn: () => financeiroService.pagamentos(busca),
    placeholderData: keepPreviousData,
  })

export const useParcelas = (pagamentoId: number, habilitado: boolean) =>
  useQuery({
    queryKey: ['pagamentos', 'parcelas', pagamentoId],
    queryFn: () => financeiroService.parcelas(pagamentoId),
    enabled: habilitado,
  })

export function useCriarTransacao(rotulo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: financeiroService.criarTransacao,
    onSuccess: () => {
      toast.success(`${rotulo} lançada`)
      // Entra no caixa, nos pagamentos e nos relatórios.
      return queryClient.invalidateQueries()
    },
  })
}

export function useRemoverTransacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: financeiroService.removerTransacao,
    onSuccess: () => {
      toast.success('Lançamento removido')
      return queryClient.invalidateQueries()
    },
  })
}
