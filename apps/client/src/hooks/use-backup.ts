import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { backupService } from '@/services/backup.service'

const chave = ['backup'] as const

/** `acompanhar` faz a tela perguntar de 2 em 2 segundos (enquanto espera o retorno do Google). */
export const useEstadoBackup = (acompanhar = false) =>
  useQuery({
    queryKey: [...chave, 'estado'],
    queryFn: backupService.estado,
    refetchInterval: acompanhar ? 2000 : false,
  })

export const useArquivosBackup = () =>
  useQuery({ queryKey: [...chave, 'arquivos'], queryFn: backupService.arquivos })

export function useExecutarBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backupService.executar,
    onSuccess: (estado) => {
      if (estado.ultimoErro)
        toast.warning('Backup feito no computador, mas o envio ao Google falhou')
      else toast.success('Backup concluído')
      return queryClient.invalidateQueries({ queryKey: chave })
    },
  })
}

export function useRestaurarBackup() {
  return useMutation({
    mutationFn: ({ origem, id }: { origem: 'local' | 'drive'; id: string }) =>
      backupService.restaurar(origem, id),
  })
}

export function useSalvarCredenciaisGoogle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backupService.salvarCredenciais,
    onSuccess: () => {
      toast.success('Credenciais do Google salvas')
      return queryClient.invalidateQueries({ queryKey: chave })
    },
  })
}

export function useDesconectarGoogle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backupService.desconectar,
    onSuccess: () => {
      toast.success('Google Drive desconectado')
      return queryClient.invalidateQueries({ queryKey: chave })
    },
  })
}
