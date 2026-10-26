import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { empresaVazia } from '@/models/empresa.model'
import { CriarUsuarioDialog } from './criar-usuario-dialog'
import { EmpresaCard } from './empresa-card'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

let enviados: { rota: string; corpo: unknown }[]

beforeEach(() => {
  enviados = []
  vi.mocked(toast.success).mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, opcoes: RequestInit = {}) => {
      const corpo = opcoes.body ? JSON.parse(String(opcoes.body)) : undefined
      enviados.push({ rota: `${opcoes.method ?? 'GET'} ${url}`, corpo })
      return new Response(JSON.stringify(corpo ?? {}))
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const renderizar = (elemento: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{elemento}</QueryClientProvider>)

const preencher = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })

describe('CriarUsuarioDialog', () => {
  it('confere usuário e senha antes de cadastrar', async () => {
    renderizar(<CriarUsuarioDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }))

    preencher('Usuário', 'ab')
    preencher('Senha', '123')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Use pelo menos 3 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Use pelo menos 8 caracteres')).toBeInTheDocument()
    expect(enviados).toEqual([])
  })

  it('cadastra como usuário comum por padrão e fecha o diálogo', async () => {
    renderizar(<CriarUsuarioDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }))

    preencher('Usuário', 'balcao')
    preencher('Senha', 'senha-segura-2')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(enviados).toEqual([
      {
        rota: 'POST /api/usuarios',
        corpo: { usuario: 'balcao', senha: 'senha-segura-2', role: 'usuario' },
      },
    ])
    expect(toast.success).toHaveBeenCalledWith('Usuário cadastrado')
  })
})

describe('EmpresaCard (R-CFG-01)', () => {
  it('começa vazio e salva o que foi preenchido, com máscaras', async () => {
    renderizar(<EmpresaCard empresa={empresaVazia} />)
    expect((screen.getByLabelText('Nome da empresa') as HTMLInputElement).value).toBe('')

    preencher('Nome da empresa', 'Assistência Exemplo')
    preencher('CNPJ', '11222333000181')
    preencher('Telefone', '11999990000')
    preencher('CEP', '01001000')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar dados da empresa' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Dados da empresa salvos'))
    expect(enviados[0]).toEqual({
      rota: 'PUT /api/empresa',
      corpo: {
        nome: 'Assistência Exemplo',
        cnpj: '11.222.333/0001-81',
        telefone: '(11) 99999-0000',
        endereco: '',
        cep: '01001-000',
      },
    })
  })
})
