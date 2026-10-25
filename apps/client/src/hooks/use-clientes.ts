import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type BuscaClientes, clientesService } from '@/services/clientes.service'

export const chavesClientes = {
  todos: ['clientes'] as const,
  lista: (busca: BuscaClientes) => ['clientes', 'lista', busca] as const,
  detalhe: (id: number) => ['clientes', 'detalhe', id] as const,
}

export const useClientes = (busca: BuscaClientes) =>
  useQuery({
    queryKey: chavesClientes.lista(busca),
    queryFn: () => clientesService.listar(busca),
    placeholderData: keepPreviousData,
  })

export const useCliente = (id: number | undefined) =>
  useQuery({
    queryKey: chavesClientes.detalhe(id ?? 0),
    queryFn: () => clientesService.buscar(id as number),
    enabled: id !== undefined,
  })

export function useCriarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clientesService.criar,
    onSuccess: () => {
      toast.success('Cliente cadastrado')
      return queryClient.invalidateQueries({ queryKey: chavesClientes.todos })
    },
  })
}

export function useAtualizarCliente(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: Parameters<typeof clientesService.atualizar>[1]) =>
      clientesService.atualizar(id, dados),
    onSuccess: () => {
      toast.success('Cliente atualizado')
      return queryClient.invalidateQueries({ queryKey: chavesClientes.todos })
    },
  })
}

export function useRemoverCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clientesService.remover,
    onSuccess: () => {
      toast.success('Cliente removido')
      // Os aparelhos e as OS dele também somem.
      return queryClient.invalidateQueries()
    },
  })
}
