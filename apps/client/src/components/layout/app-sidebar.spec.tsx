import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import type { SessaoUsuario } from '@/models/auth.model'
import { AppSidebar } from './app-sidebar'

const navegar = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navegar,
  // Repassa os atributos (title, className...) e descarta os que são só do roteador.
  Link: ({
    to,
    children,
    activeOptions: _opcoes,
    activeProps: _ativo,
    ...atributos
  }: {
    to: string
    children: ReactNode
    activeOptions?: unknown
    activeProps?: unknown
  }) => (
    <a href={to} {...atributos}>
      {children}
    </a>
  ),
}))

let versao = '2.1.0'
let logoutOk = true

beforeEach(() => {
  usePreferenciasStore.setState({ menuRecolhido: false, tamanhoDeLetra: 1 })
  document.documentElement.style.fontSize = ''
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

describe('AppSidebar: menu recolhível (R-UX-04)', () => {
  const menu = () => screen.getByRole('complementary')

  it('recolhe para só os ícones, guarda a escolha e volta; os nomes seguem para leitores de tela', () => {
    renderizar('admin')
    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu (Ctrl+B)' }))

    expect(menu()).toHaveAttribute('data-recolhido', 'true')
    expect(usePreferenciasStore.getState().menuRecolhido).toBe(true)
    const clientes = screen.getByRole('link', { name: 'Clientes' })
    expect(clientes).toHaveAttribute('title', 'Clientes')
    expect(within(clientes).getByText('Clientes')).toHaveClass('sr-only')
    expect(screen.getByRole('button', { name: 'Buscar (Ctrl+K)' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir menu (Ctrl+B)' }))
    expect(menu()).toHaveAttribute('data-recolhido', 'false')
    expect(
      within(screen.getByRole('link', { name: 'Clientes' })).getByText('Clientes'),
    ).not.toHaveClass('sr-only')
  })

  it('Ctrl+B recolhe e expande de qualquer tela', () => {
    renderizar('admin')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(menu()).toHaveAttribute('data-recolhido', 'true')
    fireEvent.keyDown(window, { key: 'B', ctrlKey: true })
    expect(menu()).toHaveAttribute('data-recolhido', 'false')
  })
})

describe('AppSidebar: tamanho da letra (R-UX-05)', () => {
  it('A+ e A− mudam o tamanho de todo o sistema, dentro de um limite', () => {
    renderizar('usuario')
    const maior = screen.getByRole('button', { name: 'Aumentar a letra' })
    const menor = screen.getByRole('button', { name: 'Diminuir a letra' })

    fireEvent.click(maior)
    expect(document.documentElement.style.fontSize).toBe('112.5%')
    fireEvent.click(maior)
    expect(document.documentElement.style.fontSize).toBe('125%')
    expect(maior).toBeDisabled()

    fireEvent.click(menor)
    fireEvent.click(menor)
    fireEvent.click(menor)
    expect(document.documentElement.style.fontSize).toBe('87.5%')
    expect(menor).toBeDisabled()
    expect(usePreferenciasStore.getState().tamanhoDeLetra).toBe(0)

    // O próprio store não passa dos limites (atalho, preferência antiga...), não só o botão.
    act(() => usePreferenciasStore.getState().mudarLetra(-1))
    expect(usePreferenciasStore.getState().tamanhoDeLetra).toBe(0)
  })
})
