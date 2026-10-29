import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AparenciaCard } from '@/components/domain/aparencia-card'
import { useThemeStore } from '@/hooks/use-theme-store'
import { type IdModelo, MODELOS_DE_TELA, menuDoModelo, modeloPorId } from '@/libs/modelos-de-tela'
import {
  caixa,
  clienteDetalhe,
  clienteListado,
  itemCaixa,
  ordemDetalhe,
  ordemListada,
  pagina,
} from '../dados'
import { abrirTela, esperarTitulo, type Pedido } from '../tela'

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

type ApiDoTeste = NonNullable<NonNullable<Parameters<typeof abrirTela>[1]>['api']>

const abrirComModelo = (modelo: IdModelo, url: string, api: ApiDoTeste = {}) => {
  act(() => useThemeStore.getState().definirModelo(modelo))
  return abrirTela(url, { api })
}

describe('D · Planilha: as outras telas', () => {
  it('lista de OS: o código mostra a OS ao lado, sem sair da lista', async () => {
    abrirComModelo('planilha', '/ordens-servico', {
      'GET /ordens-servico': pagina([ordemListada()]),
      'GET /ordens-servico/42': ordemDetalhe(),
    })
    expect(
      await screen.findByText('Clique no código de uma OS para ver os detalhes aqui.'),
    ).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver a OS 42 ao lado' }))
    const painel = await screen.findByRole('complementary', { name: 'OS 42' })
    expect(within(painel).getByText('Compressor queimado', { exact: false })).toBeInTheDocument()
    // Total R$ 350,00, pago R$ 350,00 no crédito: não falta nada.
    expect(within(painel).getByText('Falta receber').nextSibling).toHaveTextContent('R$ 0,00')
    expect(within(painel).getByRole('link', { name: /Editar/ })).toHaveAttribute(
      'href',
      '/ordens-servico/42',
    )
  })

  it('clientes: o nome mostra a ficha ao lado, com os aparelhos e o atalho para a OS', async () => {
    abrirComModelo('planilha', '/clientes', {
      'GET /clientes': pagina([clienteListado()]),
      'GET /clientes/7': clienteDetalhe(),
    })
    fireEvent.click(
      await screen.findByRole('button', { name: 'Ver a ficha de João da Silva ao lado' }),
    )
    const painel = await screen.findByRole('complementary', { name: 'Ficha de João da Silva' })
    expect(within(painel).getByText('Geladeira')).toBeInTheDocument()
    expect(within(painel).getByText('Sem garantia')).toBeInTheDocument()
    expect(within(painel).getByRole('link', { name: 'Gerar OS' })).toHaveAttribute(
      'href',
      '/ordens-servico/nova?clienteId=7&aparelhoId=3',
    )
  })

  it('nova OS: cliente e aparelho fixos ao lado do formulário', async () => {
    abrirComModelo('planilha', '/ordens-servico/nova?clienteId=7&aparelhoId=3', {
      'GET /clientes/7': clienteDetalhe(),
    })
    await esperarTitulo('Gerar ordem de serviço')
    const lado = screen.getByRole('complementary', { name: 'Cliente e aparelho' })
    expect(within(lado).getByText('Geladeira')).toBeInTheDocument()
  })

  it('caixa: entrada e saída em colunas separadas', async () => {
    abrirComModelo('planilha', '/caixa', {
      'GET /caixa': caixa([
        itemCaixa(),
        itemCaixa({
          id: 2,
          valor: -5000,
          ordemServicoId: null,
          descricao: 'Peças',
          transacaoId: 9,
        }),
      ]),
    })
    expect(await screen.findByRole('columnheader', { name: /Entrada/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Saída' })).toBeInTheDocument()
    const totais = screen.getByRole('region', { name: 'Totais do período' })
    expect(await within(totais).findByText(/300,00/)).toBeInTheDocument()
  })
})

describe('E · Cartões: as outras telas', () => {
  it('lista de OS em cartões; as abas filtram pelo status', async () => {
    const tela = abrirComModelo('cartoes', '/ordens-servico', {
      'GET /ordens-servico': pagina([ordemListada()]),
    })
    const cartoes = await screen.findByRole('region', { name: 'Ordens de serviço' })
    expect(within(cartoes).getByRole('article')).toHaveTextContent('Geladeira')
    fireEvent.click(screen.getByRole('button', { name: 'Aguardando' }))
    await waitFor(() =>
      expect(tela.pedidos('GET /ordens-servico').at(-1)?.query.get('busca')).toBe('AGUARDANDO'),
    )
    expect(tela.pedidos('GET /ordens-servico').at(-1)?.query.get('campo')).toBe('status')
    expect(screen.getByRole('button', { name: 'Aguardando' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('ficha do cliente em abas; o que foi digitado continua lá ao trocar de aba', async () => {
    abrirComModelo('cartoes', '/clientes/7', {
      'GET /clientes/7': clienteDetalhe(),
      'GET /ordens-servico': pagina([ordemListada()]),
    })
    expect(await screen.findByRole('heading', { name: 'João da Silva' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aparelhos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: /Nova OS/ })).toHaveAttribute(
      'href',
      '/ordens-servico/nova?clienteId=7&aparelhoId=3',
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Dados e endereço' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João Silva' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Histórico de OS' }))
    expect(await screen.findByRole('article')).toHaveTextContent('OS 42')
    fireEvent.click(screen.getByRole('tab', { name: 'Dados e endereço' }))
    expect(screen.getByLabelText('Nome')).toHaveValue('João Silva')
  })

  it('nova OS passo a passo; salvar com erro volta para a etapa do erro', async () => {
    abrirComModelo('cartoes', '/ordens-servico/nova?clienteId=7&aparelhoId=3', {
      'GET /clientes/7': clienteDetalhe(),
    })
    await esperarTitulo('Nova ordem de serviço')
    const etapas = screen.getByRole('list', { name: 'Etapas' })
    const etapa = (nome: string) => within(etapas).getByRole('button', { name: new RegExp(nome) })
    expect(etapa('Problema')).toHaveAttribute('aria-current', 'step')
    fireEvent.click(etapa('Situação e valores'))
    fireEvent.change(screen.getByLabelText('Data de abertura'), { target: { value: '' } })
    fireEvent.click(etapa('Pagamento'))
    expect(etapa('Pagamento')).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(etapa('Situação e valores')).toHaveAttribute('aria-current', 'step'))
    expect(screen.getByText('Informe a data de abertura')).toBeInTheDocument()
  })

  it('caixa com o gráfico de entradas e saídas por semana', async () => {
    abrirComModelo('cartoes', '/caixa', {
      'GET /caixa': caixa([itemCaixa(), itemCaixa({ id: 2, valor: -5000, data: '2026-10-20' })]),
    })
    const grafico = await screen.findByRole('list', { name: 'Entradas e saídas por semana' })
    expect(
      within(grafico)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringMatching(/Entradas R\$\s350,00, saídas R\$\s0,00/),
      expect.stringMatching(/Entradas R\$\s0,00, saídas R\$\s50,00/),
    ])
  })
})
