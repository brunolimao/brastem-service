import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { baixarArquivo } from '@/libs/arquivos'
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

/** Botão "Gerar diagnóstico": baixa o .zip para o administrador mandar ao suporte (R-CFG-10). */
export const useGerarDiagnostico = () =>
  useMutation({
    mutationFn: sistemaService.diagnostico,
    onSuccess: (arquivo) => {
      baixarArquivo(arquivo, `diagnostico-brastem-${format(new Date(), 'yyyy-MM-dd')}.zip`)
      toast.success('Diagnóstico gerado. Envie o arquivo para o suporte.')
    },
  })
