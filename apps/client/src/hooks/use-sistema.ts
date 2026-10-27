import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sistemaService } from '@/services/sistema.service'

/** Versão do app (não muda enquanto ele está aberto: uma atualização sempre reinicia o app). */
export const useVersao = () =>
  useQuery({
    queryKey: ['sistema'],
    queryFn: sistemaService.informacoes,
    staleTime: Number.POSITIVE_INFINITY,
    select: (dados) => dados.versao,
  })

/** Botão "Procurar atualização": a resposta vem numa janela do app (como Ajuda → Verificar atualizações). */
export const useProcurarAtualizacao = () =>
  useMutation({
    mutationFn: sistemaService.procurarAtualizacao,
    onSuccess: ({ iniciado }) =>
      iniciado
        ? toast.success('Procurando atualização... a resposta aparece numa janela.')
        : toast.info('Atualizações só funcionam no app instalado.'),
  })
