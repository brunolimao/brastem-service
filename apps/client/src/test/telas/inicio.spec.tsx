import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MAXIMO_RECENTES, useRecentesStore } from '@/hooks/use-recentes'
import { clienteDetalhe, ordemDetalhe } from '../dados'
import { ADMIN, abrirTela, COMUM, esperarCaminho, esperarTitulo } from '../tela'

const atalhos = () =>
  within(screen.getByText('Atalhos').closest('[data-slot=card]') as HTMLElement)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim())

const recentes = () =>
  within(screen.getByText('Abertos recentemente').closest('[data-slot=card]') as HTMLElement)
    .queryAllByRole('link')
    .map((link) => link.textContent)

describe('Início (R-UX-03)', () => {
  it('atalhos do dia a dia para o administrador', async () => {
    abrirTela('/')
    await esperarTitulo('Olá, ana')
    expect(atalhos()).toEqual([
      'Cadastrar cliente',
      'Ordens de serviço',
      'Lançar receita',
      'Lançar despesa',
      'Caixa',
    ])
  })

  it('usuário comum não tem o atalho do caixa', async () => {
    abrirTela('/', { usuario: COMUM })
    await esperarTitulo('Olá, bruno')
    expect(atalhos()).not.toContain('Caixa')
  })

  it('"Buscar cliente ou OS" abre a busca rápida', async () => {
    abrirTela('/')
    fireEvent.click(await screen.findByRole('button', { name: /Buscar cliente ou OS/ }))
    expect(screen.getByRole('combobox', { name: 'Buscar cliente ou OS' })).toBeInTheDocument()
  })

  it('lembra as fichas abertas, da mais nova para a mais antiga, sem repetir', async () => {
    const tela = abrirTela('/clientes/7', {
      api: { 'GET /clientes/7': clienteDetalhe(), 'GET /ordens-servico/42': ordemDetalhe() },
    })
    await esperarTitulo('João da Silva')
    await tela.router.navigate({ to: '/ordens-servico/$ordemId', params: { ordemId: '42' } })
    await esperarTitulo('Ordem de serviço 42')
    await tela.router.navigate({ to: '/clientes/$clienteId', params: { clienteId: '7' } })
    await esperarTitulo('João da Silva')
    await tela.router.navigate({ to: '/' })
    await esperarTitulo('Olá, ana')

    expect(recentes()).toEqual([
      expect.stringContaining('João da Silva'),
      expect.stringContaining('OS 42 · João da Silva'),
    ])
    fireEvent.click(screen.getByRole('link', { name: /OS 42/ }))
    await esperarCaminho(tela, '/ordens-servico/42')
  })

  it('cada usuário vê as próprias fichas, e só as últimas', async () => {
    const { registrar } = useRecentesStore.getState()
    abrirTela('/', { usuario: COMUM })
    await esperarTitulo('Olá, bruno')
    for (let id = 1; id <= MAXIMO_RECENTES + 2; id++) {
      registrar(ADMIN.id, { tipo: 'cliente', id, titulo: `Cliente ${id}`, detalhe: '' })
    }
    // A ana abriu fichas; o bruno não vê nenhuma.
    expect(screen.getByText(/As fichas que você abrir aparecem aqui/)).toBeInTheDocument()
    expect(useRecentesStore.getState().porUsuario[ADMIN.id]).toHaveLength(MAXIMO_RECENTES)
    expect(useRecentesStore.getState().porUsuario[ADMIN.id]?.[0]?.titulo).toBe(
      `Cliente ${MAXIMO_RECENTES + 2}`,
    )
  })
})
