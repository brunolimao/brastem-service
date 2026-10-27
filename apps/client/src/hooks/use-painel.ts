import { useQuery } from '@tanstack/react-query'
import { painelService } from '@/services/painel.service'

/** Resumo do Início; as gravações (OS, clientes, lançamentos) já recarregam tudo ao salvar. */
export const usePainel = () => useQuery({ queryKey: ['painel'], queryFn: painelService.resumo })
