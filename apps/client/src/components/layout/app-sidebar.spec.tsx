import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/hooks/use-session-store'
import type { SessaoUsuario } from '@/models/auth.model'
import { AppSidebar } from './app-sidebar'

const navegar = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navegar,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))

let versao = '2.1.0'
let logoutOk = true

beforeEach(() => {
  navegar.mockReset()
  versao = '2.1.0'
  logoutOk = true
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.startsWith('/api/sistema')) return new Response(JSON.stringify({ versao }))
      if (url.startsWith('/api/auth/logout'))
        return logoutOk ? new Response(null, { status: 204 }) : new Response('{}', { status: 500 })
      return new Response('{}', { status: 404 })
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const renderizar = (role: SessaoUsuario['role']) => {
  useSessionStore.getState().entrar({ id: 1, usuario: 'ana', role } as SessaoUsuario)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AppSidebar />
    </QueryClientProvider>,
  )
}

const itensDoMenu = () => screen.getAllByRole('link').map((link) => link.textContent)

describe('AppSidebar: menu conforme o papel (R-PERM-03)', () => {
  it('administrador vê todas as telas', () => {
    renderizar('admin')
    expect(itensDoMenu()).toEqual([
      'Início',
      'Clientes',
      'Ordens de serviço',
      'Caixa',
      'Lançar receita',
      'Lançar despesa',
      'Pagamentos',
      'Relatórios',
      'Usuários',
      'Configurações',
    ])
  })

  it('usuário comum não vê caixa, pagamentos, relatórios nem administração', () => {
    renderizar('usuario')
    expect(itensDoMenu()).toEqual([
      'Início',
      'Clientes',
      'Ordens de serviço',
      'Lançar receita',
      'Lançar despesa',
    ])
    expect(screen.queryByText('Administração')).toBeNull()
  })
})

describe('AppSidebar: rodapé', () => {
  it('mostra a versão do app instalado', async () => {
    renderizar('usuario')
    expect(await screen.findByText('Versão 2.1.0')).toBeInTheDocument()
  })

  it('rodando em desenvolvimento, diz isso em vez de um número', async () => {
    versao = 'desenvolvimento'
    renderizar('usuario')
    expect(await screen.findByText('Desenvolvimento')).toBeInTheDocument()
  })

  it('Sair volta ao login mesmo se o servidor falhar', async () => {
    logoutOk = false
    renderizar('admin')
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(navegar).toHaveBeenCalledWith({ to: '/login' }))
    expect(useSessionStore.getState().usuario).toBeNull()
  })
})
