import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApagarTudoCard } from './apagar-tudo-card'

let resposta: Response
let pedidos: { rota: string; corpo: unknown }[]

beforeEach(() => {
  pedidos = []
  resposta = new Response(JSON.stringify({ reiniciando: true }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, opcoes: RequestInit = {}) => {
      pedidos.push({
        rota: `${opcoes.method ?? 'GET'} ${url}`,
        corpo: JSON.parse(String(opcoes.body ?? 'null')),
      })
      return resposta
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const abrir = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApagarTudoCard />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Apagar todos os dados' }))
  return screen.getByRole('alertdialog')
}

describe('ApagarTudoCard (R-CFG-08, R-BKP-12)', () => {
  it('deixa claro o que some, o que fica, o que vem depois e como desfazer', () => {
    const dialogo = abrir()
    expect(dialogo).toHaveTextContent('todos os usuários, inclusive o seu')
    expect(dialogo).toHaveTextContent('clientes, aparelhos, ordens de serviço')
    expect(dialogo).toHaveTextContent('Continuam: os backups')
    expect(dialogo).toHaveTextContent('primeiro acesso')
    expect(dialogo).toHaveTextContent('importar os dados do sistema antigo')
    expect(dialogo).toHaveTextContent('antes-da-restauracao')
  })

  it('só apaga depois de digitar a senha', async () => {
    const dialogo = abrir()
    const apagar = within(dialogo).getByRole('button', { name: 'Apagar tudo' })
    expect(apagar).toBeDisabled()

    fireEvent.change(within(dialogo).getByLabelText('Sua senha'), {
      target: { value: 'senha-segura-1' },
    })
    expect(apagar).toBeEnabled()
    fireEvent.click(apagar)

    expect(await screen.findByText(/está reiniciando/)).toBeInTheDocument()
    expect(pedidos).toEqual([
      { rota: 'POST /api/backup/apagar-tudo', corpo: { senha: 'senha-segura-1' } },
    ])
  })

  it('fora do app desktop, pede para fechar e abrir', async () => {
    resposta = new Response(JSON.stringify({ reiniciando: false }))
    const dialogo = abrir()
    fireEvent.change(within(dialogo).getByLabelText('Sua senha'), { target: { value: 'x' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Apagar tudo' }))
    expect(await screen.findByText(/Feche e abra/)).toBeInTheDocument()
  })

  it('senha errada: continua no diálogo para tentar de novo, sem sair do sistema', async () => {
    resposta = new Response(JSON.stringify({ message: 'Senha incorreta.' }), { status: 403 })
    const dialogo = abrir()
    fireEvent.change(within(dialogo).getByLabelText('Sua senha'), { target: { value: 'errada' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Apagar tudo' }))
    await waitFor(() => expect(pedidos).toHaveLength(1))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.queryByText(/está reiniciando|Feche e abra/)).toBeNull()
  })

  it('cancelar fecha sem apagar e esquece a senha digitada', async () => {
    let dialogo = abrir()
    fireEvent.change(within(dialogo).getByLabelText('Sua senha'), { target: { value: 'abc' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(pedidos).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Apagar todos os dados' }))
    dialogo = screen.getByRole('alertdialog')
    expect((within(dialogo).getByLabelText('Sua senha') as HTMLInputElement).value).toBe('')
  })
})
