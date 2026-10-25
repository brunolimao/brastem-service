import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { empresaService } from '@/services/empresa.service'

const chave = ['empresa'] as const

export const useEmpresa = () => useQuery({ queryKey: chave, queryFn: empresaService.obter })

export function useSalvarEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: empresaService.salvar,
    onSuccess: (empresa) => {
      toast.success('Dados da empresa salvos')
      queryClient.setQueryData(chave, empresa)
    },
  })
}
