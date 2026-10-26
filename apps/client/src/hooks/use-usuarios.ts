import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usuariosService } from '@/services/usuarios.service'

const chave = ['usuarios'] as const

export const useUsuarios = (page?: number) =>
  useQuery({
    queryKey: [...chave, page],
    queryFn: () => usuariosService.listar(page),
    placeholderData: keepPreviousData,
  })

export function useCriarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usuariosService.criar,
    onSuccess: () => {
      toast.success('Usuário cadastrado')
      return queryClient.invalidateQueries({ queryKey: chave })
    },
  })
}

export function useRemoverUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usuariosService.remover,
    onSuccess: () => {
      toast.success('Usuário removido')
      return queryClient.invalidateQueries({ queryKey: chave })
    },
  })
}
