import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type BuscaOrdens, ordensServicoService } from '@/services/ordens-servico.service'

export const chavesOrdens = {
  todos: ['ordens-servico'] as const,
  lista: (busca: BuscaOrdens) => ['ordens-servico', 'lista', busca] as const,
  detalhe: (id: number) => ['ordens-servico', 'detalhe', id] as const,
}

export const useOrdensServico = (busca: BuscaOrdens) =>
  useQuery({
    queryKey: chavesOrdens.lista(busca),
    queryFn: () => ordensServicoService.listar(busca),
    placeholderData: keepPreviousData,
  })

export const useOrdemServico = (id: number) =>
  useQuery({
    queryKey: chavesOrdens.detalhe(id),
    queryFn: () => ordensServicoService.buscar(id),
  })

export function useCriarOrdemServico() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ordensServicoService.criar,
    onSuccess: () => {
      toast.success('Ordem de serviço gerada')
      // Mexe na garantia do aparelho, no caixa e nos relatórios também.
      return queryClient.invalidateQueries()
    },
  })
}

export function useAtualizarOrdemServico(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: Parameters<typeof ordensServicoService.atualizar>[1]) =>
      ordensServicoService.atualizar(id, dados),
    onSuccess: () => {
      toast.success('Ordem de serviço atualizada')
      return queryClient.invalidateQueries()
    },
  })
}

export function useRemoverOrdemServico() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ordensServicoService.remover,
    onSuccess: () => {
      toast.success('Ordem de serviço removida')
      return queryClient.invalidateQueries()
    },
  })
}
