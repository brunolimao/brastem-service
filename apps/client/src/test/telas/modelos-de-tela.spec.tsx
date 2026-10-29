import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AparenciaCard } from '@/components/domain/aparencia-card'
import { useThemeStore } from '@/hooks/use-theme-store'
import { type IdModelo, MODELOS_DE_TELA, menuDoModelo, modeloPorId } from '@/libs/modelos-de-tela'
import { ordemListada, pagina } from '../dados'
import { abrirTela, type Pedido } from '../tela'

// Branch experimento/modelos-de-tela: cada modelo abre, com a casca e o Início dele.
afterEach(() => act(() => useThemeStore.getState().definirModelo('oficina')))

/** Lista de OS por status: uma OS de cada, com o status pedido. */
const osPorStatus = (pedido: Pedido) =>
  pagina(
    [
      ordemListada({
        id: 90,
        status: (pedido.query.get('busca') ?? 'ABERTO') as 'ABERTO',
        clienteNome: 'Cliente Fila',
        aparelhoNome: 'Fogão',
      }),
    ],
    1,
    1,
    6,
  )

const abrirNoModelo = (modelo: IdModelo) => {
  act(() => useThemeStore.getState().definirModelo(modelo))
  return abrirTela('/', { api: { 'GET /ordens-servico': osPorStatus } })
}

describe('modelos de tela (em teste)', () => {
  it('são 5; o padrão é o de hoje e preferência desconhecida volta para ele', () => {
    expect(MODELOS_DE_TELA.map((modelo) => modelo.id)).toEqual([
      'oficina',
      'painel',
      'balcao',
      'planilha',
      'cartoes',
    ])
    expect(modeloPorId('nao-existe')).toBe('oficina')
    expect(menuDoModelo('painel')).toBe('topo')
    expect(menuDoModelo('cartoes')).toBe('lateral-claro')
  })

  it('o seletor em Aparência troca o modelo e marca a página', () => {
    render(<AparenciaCard />)
    const grupo = screen.getByRole('group', { name: 'Modelo de tela (em teste)' })
    expect(within(grupo).getAllByRole('button')).toHaveLength(5)
    fireEvent.click(within(grupo).getByRole('button', { name: /D · Planilha/ }))
    expect(useThemeStore.getState().modelo).toBe('planilha')
    expect(document.documentElement.dataset.modelo).toBe('planilha')
  })

  it('A · Oficina: menu lateral e o Início de sempre', async () => {
    abrirNoModelo('oficina')
    expect(await screen.findByText('Atalhos')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveAttribute('data-menu')
  })

  it('B · Painel: menu no topo e a fila de trabalho por status', async () => {
    const tela = abrirNoModelo('painel')
    const fila = await screen.findByRole('region', { name: 'Fila de trabalho' })
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(
      screen.getByRole('navigation', { name: 'Menu principal' }).closest('header'),
    ).toBeTruthy()
    expect(within(fila).getByText('Aguardando')).toBeInTheDocument()
    await waitFor(() => expect(within(fila).getAllByText('Cliente Fila')).toHaveLength(3))
    const status = tela.pedidos('GET /ordens-servico').map((pedido) => pedido.query.get('busca'))
    expect(status.sort()).toEqual(['ABERTO', 'AGUARDANDO', 'APROVADO'])
  })

  it('C · Balcão: busca em destaque e as OS aguardando', async () => {
    abrirNoModelo('balcao')
    expect(await screen.findByText('Quem chegou no balcão?')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveAttribute('data-menu')
    expect(await screen.findByText(/Cliente Fila · Fogão/)).toBeInTheDocument()
  })

  it('D · Planilha: barra no topo e a tabela das paradas', async () => {
    abrirNoModelo('planilha')
    const paradas = await screen.findByRole('region', { name: 'Paradas há mais tempo' })
    expect(within(paradas).getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('E · Cartões: menu claro e as paradas em cartões', async () => {
    abrirNoModelo('cartoes')
    const paradas = await screen.findByRole('region', { name: 'Paradas há mais tempo' })
    expect((await within(paradas).findAllByRole('article')).length).toBeGreaterThan(0)
    expect(screen.getByRole('complementary')).toHaveAttribute('data-menu')
  })
})
