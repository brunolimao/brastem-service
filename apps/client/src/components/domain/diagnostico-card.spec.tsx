import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiagnosticoCard } from './diagnostico-card'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

let baixados: { nome: string; endereco: string }[] = []

beforeEach(() => {
  baixados = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Uint8Array([80, 75, 3, 4]), { status: 200 })),
  )
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => 'blob:diagnostico',
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    baixados.push({ nome: this.download, endereco: this.href })
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DiagnosticoCard (R-CFG-10)', () => {
  it('gera o .zip no servidor e entrega para salvar, com a data no nome', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DiagnosticoCard />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gerar diagnóstico' }))

    await waitFor(() => expect(baixados).toHaveLength(1))
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/sistema/diagnostico')
    expect(baixados[0]?.nome).toMatch(/^diagnostico-brastem-\d{4}-\d{2}-\d{2}\.zip$/)
    expect(baixados[0]?.endereco).toBe('blob:diagnostico')
    expect(toast.success).toHaveBeenCalledWith(
      'Diagnóstico gerado. Envie o arquivo para o suporte.',
    )
  })
})
