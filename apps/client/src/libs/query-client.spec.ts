import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/api'
import { notificarErro, queryClient } from './query-client'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => vi.mocked(toast.error).mockClear())

describe('notificarErro: todo erro de requisição vira um aviso', () => {
  it('mostra a mensagem do servidor quando há uma só', () => {
    notificarErro(new ApiError(409, ['Já existe um usuário com esse nome']))
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('Já existe um usuário com esse nome')
  })

  it('junta várias mensagens de validação num aviso só', () => {
    notificarErro(new ApiError(400, ['Informe o nome', 'CEP inválido']))
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('Confira os dados informados', {
      description: 'Informe o nome\nCEP inválido',
    })
  })

  it('não avisa quando a sessão expirou: a volta ao login já resolve (R-ACE-06)', () => {
    notificarErro(new ApiError(401, ['Sessão expirada'], true))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('erro que não veio da API ganha uma mensagem genérica', () => {
    notificarErro(new TypeError('x is undefined'))
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('Algo deu errado. Tente novamente.')
  })
})

describe('queryClient: novas tentativas', () => {
  const tentarDeNovo = queryClient.getDefaultOptions().queries?.retry as (
    tentativas: number,
    erro: unknown,
  ) => boolean

  it('não repete erro do pedido (4xx): repetir não muda a resposta', () => {
    expect(tentarDeNovo(0, new ApiError(400, ['x']))).toBe(false)
    expect(tentarDeNovo(0, new ApiError(404, ['x']))).toBe(false)
  })

  it('repete até 2 vezes erro do servidor ou falta de conexão', () => {
    for (const erro of [new ApiError(500, ['x']), new ApiError(0, ['sem conexão'])]) {
      expect(tentarDeNovo(0, erro)).toBe(true)
      expect(tentarDeNovo(1, erro)).toBe(true)
      expect(tentarDeNovo(2, erro)).toBe(false)
    }
  })

  it('os erros das consultas e das gravações passam pelo aviso', () => {
    queryClient.getQueryCache().config.onError?.(new ApiError(500, ['Falhou']), {} as never)
    queryClient
      .getMutationCache()
      .config.onError?.(new ApiError(400, ['Inválido']), undefined, undefined, {} as never, {
        client: queryClient,
        meta: undefined,
      })
    expect(vi.mocked(toast.error).mock.calls).toEqual([['Falhou'], ['Inválido']])
  })
})
