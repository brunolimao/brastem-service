import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLogout } from './use-auth'
import { useAtualizarCliente, useCriarCliente, useRemoverCliente } from './use-clientes'
import { useCriarTransacao, useRemoverTransacao } from './use-financeiro'
import { useAtualizarOrdemServico, useCriarOrdemServico } from './use-ordens-servico'
import { useSessionStore } from './use-session-store'
import { useCriarUsuario } from './use-usuarios'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

/** Consultas que as telas mantêm em cache; depois de gravar, as afetadas precisam ser recarregadas. */
const CHAVES = {
  clientes: ['clientes', 'lista', {}],
  ordens: ['ordens-servico', 'lista', {}],
  caixa: ['caixa', { inicio: '2026-10-01', fim: '2026-10-31' }, 1],
  pagamentos: ['pagamentos', {}],
  relatorio: ['relatorio', { inicio: '2026-10-01', fim: '2026-10-31' }],
  usuarios: ['usuarios', 1],
} as const

let queryClient: QueryClient
let respostaOk = true

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  for (const chave of Object.values(CHAVES)) queryClient.setQueryData(chave, { carregado: true })
  respostaOk = true
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      respostaOk
        ? new Response('{"id":1}', { status: 200 })
        : new Response('{"message":"Falhou"}', { status: 500 }),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

/** Quais das consultas em cache ficaram marcadas para recarregar. */
const invalidadas = () =>
  Object.entries(CHAVES)
    .filter(([, chave]) => queryClient.getQueryState(chave)?.isInvalidated)
    .map(([nome]) => nome)

async function gravar<T>(usar: () => { mutateAsync: (dados: T) => Promise<unknown> }, dados: T) {
  const { result } = renderHook(usar, { wrapper })
  await act(() => result.current.mutateAsync(dados))
}

const TODAS = Object.keys(CHAVES)

describe('depois de gravar, as telas afetadas recarregam', () => {
  it('cliente novo só mexe na lista de clientes', async () => {
    await gravar(useCriarCliente, {} as never)
    expect(invalidadas()).toEqual(['clientes'])
  })

  it('editar cliente recarrega tudo: remover um aparelho leva as OS e os pagamentos dele', async () => {
    await gravar(() => useAtualizarCliente(1), {} as never)
    expect(invalidadas()).toEqual(TODAS)
  })

  it('excluir cliente recarrega tudo', async () => {
    await gravar(useRemoverCliente, 1)
    expect(invalidadas()).toEqual(TODAS)
  })

  it('OS nova ou editada recarrega caixa, pagamentos e relatórios', async () => {
    await gravar(useCriarOrdemServico, {} as never)
    expect(invalidadas()).toEqual(TODAS)
    queryClient.resetQueries()
    for (const chave of Object.values(CHAVES)) queryClient.setQueryData(chave, { carregado: true })
    await gravar(() => useAtualizarOrdemServico(1), {} as never)
    expect(invalidadas()).toEqual(TODAS)
  })

  it('lançar ou excluir receita/despesa recarrega o caixa e os relatórios', async () => {
    await gravar(() => useCriarTransacao('Receita'), {} as never)
    expect(invalidadas()).toEqual(TODAS)
    for (const chave of Object.values(CHAVES)) queryClient.setQueryData(chave, { carregado: true })
    await gravar(useRemoverTransacao, 1)
    expect(invalidadas()).toEqual(TODAS)
  })

  it('usuário novo só mexe na lista de usuários', async () => {
    await gravar(useCriarUsuario, {} as never)
    expect(invalidadas()).toEqual(['usuarios'])
  })

  it('gravação que falha não recarrega nada', async () => {
    respostaOk = false
    const { result } = renderHook(() => useAtualizarCliente(1), { wrapper })
    await act(() => result.current.mutateAsync({} as never).catch(() => undefined))
    expect(invalidadas()).toEqual([])
  })
})

describe('useLogout (R-ACE-05)', () => {
  it('sai da sessão e esquece os dados em cache mesmo se o servidor não responder', async () => {
    useSessionStore.getState().entrar({ id: 1, usuario: 'ana', role: 'admin' } as never)
    respostaOk = false
    const { result } = renderHook(useLogout, { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(useSessionStore.getState().situacao).toBe('anonima'))
    expect(useSessionStore.getState().usuario).toBeNull()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
