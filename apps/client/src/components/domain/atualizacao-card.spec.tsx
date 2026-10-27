import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AtualizacaoCard } from './atualizacao-card'

let versao = '2.1.0'

beforeEach(() => {
  versao = '2.1.0'
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.startsWith('/api/sistema/procurar-atualizacao'))
        return new Response(JSON.stringify({ iniciado: true }), { status: 202 })
      if (url.startsWith('/api/sistema')) return new Response(JSON.stringify({ versao }))
      return new Response('{}', { status: 404 })
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const renderizar = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AtualizacaoCard />
    </QueryClientProvider>,
  )

describe('AtualizacaoCard: procurar atualização (R-ATU-11)', () => {
  it('mostra a versão instalada e pede ao app para procurar agora', async () => {
    renderizar()
    expect(await screen.findByText('Versão instalada: 2.1.0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Procurar atualização' }))
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls).toContainEqual([
        '/api/sistema/procurar-atualizacao',
        expect.objectContaining({ method: 'POST' }),
      ]),
    )
  })

  it('em desenvolvimento não há o que atualizar: sem botão', async () => {
    versao = 'desenvolvimento'
    renderizar()
    expect(await screen.findByText('Versão de desenvolvimento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Procurar atualização' })).toBeNull()
  })
})
