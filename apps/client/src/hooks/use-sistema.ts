import { useQuery } from '@tanstack/react-query'
import { sistemaService } from '@/services/sistema.service'

/** Versão do app (não muda enquanto ele está aberto: uma atualização sempre reinicia o app). */
export const useVersao = () =>
  useQuery({
    queryKey: ['sistema'],
    queryFn: sistemaService.informacoes,
    staleTime: Number.POSITIVE_INFINITY,
    select: (dados) => dados.versao,
  })
