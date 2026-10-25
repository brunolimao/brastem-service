import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/services/api'

/** Todo erro de requisição vira toast aqui; as telas não precisam tratar. */
export function notificarErro(erro: unknown) {
  if (erro instanceof ApiError) {
    if (erro.sessaoExpirada) return
    const [primeira = 'Erro inesperado', ...demais] = erro.messages
    if (demais.length === 0) toast.error(primeira)
    else toast.error('Confira os dados informados', { description: erro.messages.join('\n') })
    return
  }
  toast.error('Algo deu errado. Tente novamente.')
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: notificarErro }),
  mutationCache: new MutationCache({ onError: notificarErro }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Erros 4xx não melhoram tentando de novo.
      retry: (tentativas, erro) =>
        !(erro instanceof ApiError && erro.status < 500 && erro.status > 0) && tentativas < 2,
    },
  },
})
