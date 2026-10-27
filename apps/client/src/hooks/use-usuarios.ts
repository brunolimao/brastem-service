import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { OpcoesDeLista } from '@/models/pagina.model'
import { usuariosService } from '@/services/usuarios.service'

const chave = ['usuarios'] as const

export const useUsuarios = (opcoes: OpcoesDeLista = {}) =>
  useQuery({
    queryKey: [...chave, opcoes],
    queryFn: () => usuariosService.listar(opcoes),
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
