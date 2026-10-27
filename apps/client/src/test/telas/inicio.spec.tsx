import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MAXIMO_RECENTES, useRecentesStore } from '@/hooks/use-recentes'
import { clienteDetalhe, ordemDetalhe, painel } from '../dados'
import { ADMIN, abrirTela, COMUM, esperarCaminho, esperarTitulo } from '../tela'

const atalhos = () =>
  within(screen.getByText('Atalhos').closest('[data-slot=card]') as HTMLElement)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim())

const recentes = () =>
  within(screen.getByText('Abertos recentemente').closest('[data-slot=card]') as HTMLElement)
    .queryAllByRole('link')
    .map((link) => link.textContent)

describe('Início: resumo do dia e do mês (R-UX-12)', () => {
  it('OS em andamento, do dia e do mês, com gráfico por status', async () => {
    abrirTela('/', { usuario: COMUM })
    expect(await screen.findByText('OS em andamento')).toBeInTheDocument()
    const card = (titulo: string) =>
      screen.getByText(titulo).closest('[data-slot=card]') as HTMLElement
    expect(within(card('OS em andamento')).getByText('6')).toBeInTheDocument()
    expect(
      within(card('OS em andamento')).getByText('2 aguardando · 1 aprovadas'),
    ).toBeInTheDocument()
    expect(within(card('Abertas hoje')).getByText('2')).toBeInTheDocument()
    expect(within(card('Fechadas no mês')).getByText('7')).toBeInTheDocument()
    expect(within(card('Clientes novos no mês')).getByText('4')).toBeInTheDocument()
    const legenda = screen.getByRole('list', { name: 'Legenda: OS em andamento por status' })
    expect(
      within(legenda)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Aberto350%', 'Aguardando233%', 'Aprovado117%'])
  })

  it('os atalhos vêm primeiro, logo abaixo do "Olá", antes dos números', async () => {
    abrirTela('/')
    const resumo = await screen.findByText('OS em andamento')
    const atalhos = screen.getByText('Atalhos')
    expect(atalhos.compareDocumentPosition(resumo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('OS paradas há mais tempo, com link para cada uma', async () => {
    const tela = abrirTela('/', { api: { 'GET /ordens-servico/30': ordemDetalhe() } })
    const lista = await screen.findByRole('list', { name: 'OS paradas há mais tempo' })
    const itens = within(lista).getAllByRole('link')
    expect(itens.map((item) => item.textContent)).toEqual([
      expect.stringMatching(
        /OS 30 · João da Silva.*Geladeira · aberta em 07\/10\/2026.*Aguardando.*20 dias/,
      ),
      expect.stringMatching(/OS 41 · Maria Souza.*1 dia$/),
    ])
    fireEvent.click(itens[0] as HTMLElement)
    await esperarCaminho(tela, '/ordens-servico/30')
  })

  it('faturamento e caixa do mês só para o administrador', async () => {
    abrirTela('/', {
      api: { 'GET /painel': painel({ financeiro: { faturamentoMes: 150000, caixaMes: -2500 } }) },
    })
    expect(await screen.findByText('R$ 1.500,00')).toBeInTheDocument()
    expect(screen.getByText('-R$ 25,00')).toHaveClass('text-destructive')
  })

  it('usuário comum não vê o financeiro', async () => {
    abrirTela('/', { usuario: COMUM })
    await screen.findByText('OS em andamento')
    expect(screen.queryByText('Faturamento do mês')).toBeNull()
    expect(screen.queryByText('Caixa do mês')).toBeNull()
  })
})

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
