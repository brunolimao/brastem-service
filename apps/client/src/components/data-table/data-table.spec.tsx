import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { type Coluna, DataTable } from './data-table'

interface Pessoa {
  id: number
  nome: string
}

const colunas: Coluna<Pessoa>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
]

beforeEach(() => usePreferenciasStore.setState({ linhasPorPagina: 25 }))

describe('DataTable', () => {
  it('mostra cabeçalhos e linhas', () => {
    render(
      <DataTable
        colunas={colunas}
        dados={[
          { id: 1, nome: 'Ana' },
          { id: 2, nome: 'Beto' },
        ]}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Beto' })).toBeInTheDocument()
  })

  it('mostra a mensagem quando não há dados', () => {
    render(<DataTable colunas={colunas} dados={[]} mensagemVazia="Nada por aqui" />)
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
  })

  it('pagina pelo servidor', async () => {
    const aoMudarPagina = vi.fn()
    render(
      <DataTable
        colunas={colunas}
        dados={[{ id: 1, nome: 'Ana' }]}
        paginacao={{ page: 2, pageSize: 10, total: 25, aoMudarPagina }}
      />,
    )
    expect(screen.getByText('25 resultados')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(aoMudarPagina).toHaveBeenCalledWith(3)
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(aoMudarPagina).toHaveBeenCalledWith(1)
  })

  it('volta para a última página quando a atual deixou de existir (ex.: após excluir)', () => {
    const aoMudarPagina = vi.fn()
    const { rerender } = render(
      <DataTable
        colunas={colunas}
        dados={[]}
        carregando
        paginacao={{ page: 3, pageSize: 10, total: 20, aoMudarPagina }}
      />,
    )
    // Enquanto carrega não decide nada (o total ainda pode ser o antigo).
    expect(aoMudarPagina).not.toHaveBeenCalled()
    rerender(
      <DataTable
        colunas={colunas}
        dados={[]}
        paginacao={{ page: 3, pageSize: 10, total: 20, aoMudarPagina }}
      />,
    )
    expect(aoMudarPagina).toHaveBeenCalledWith(2)
  })

  it('sem paginação do servidor, a própria tabela pagina (25 por página, o padrão)', async () => {
    const muitos = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, nome: `Pessoa ${i + 1}` }))
    render(<DataTable colunas={colunas} dados={muitos} />)

    expect(screen.getByText('60 resultados')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('Pessoa 25')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 26')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument()
    expect(screen.getByText('Pessoa 60')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 50')).toBeNull()
  })

  it('desabilita a navegação nas pontas', () => {
    render(
      <DataTable
        colunas={colunas}
        dados={[]}
        paginacao={{ page: 1, pageSize: 10, total: 5, aoMudarPagina: vi.fn() }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})

interface Item {
  id: number
  nome: string
  valor: number | null
}

const colunasItem: Coluna<Item>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'valor', header: 'Valor' },
  { id: 'acoes', header: 'Ações', cell: () => null },
]

const itens: Item[] = [
  { id: 1, nome: 'bruno', valor: 10 },
  { id: 2, nome: 'Álvaro', valor: null },
  { id: 3, nome: 'ana', valor: 9 },
  { id: 4, nome: 'Item 10', valor: 100 },
  { id: 5, nome: 'Item 9', valor: 2 },
]

const coluna = (indice: number) =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((linha) => within(linha).getAllByRole('cell')[indice]?.textContent)
const clicar = (cabecalho: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${cabecalho}`) }))

describe('DataTable: ordenar clicando no cabeçalho (R-UX-06)', () => {
  it('sem servidor: crescente, decrescente e de volta à ordem original', () => {
    render(<DataTable colunas={colunasItem} dados={itens} />)
    clicar('Nome')
    // Ordem do português: acento e maiúscula não separam, e "Item 9" vem antes de "Item 10".
    expect(coluna(1)).toEqual(['Álvaro', 'ana', 'bruno', 'Item 9', 'Item 10'])
    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    clicar('Nome')
    expect(coluna(1)).toEqual(['Item 10', 'Item 9', 'bruno', 'ana', 'Álvaro'])
    clicar('Nome')
    expect(coluna(0)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('números como números (inclusive negativos, como despesas); vazios sempre no fim', () => {
    const comDespesa = [
      ...itens,
      { id: 6, nome: 'Despesa', valor: -30 },
      { id: 7, nome: 'x', valor: -5 },
    ]
    render(<DataTable colunas={colunasItem} dados={comDespesa} />)
    clicar('Valor')
    expect(coluna(2)).toEqual(['-30', '-5', '2', '9', '10', '100', ''])
    clicar('Valor')
    expect(coluna(2)).toEqual(['100', '10', '9', '2', '-5', '-30', ''])
  })

  it('vazios no fim também na ordem decrescente', () => {
    render(<DataTable colunas={colunasItem} dados={itens} />)
    clicar('Valor')
    expect(coluna(2)).toEqual(['2', '9', '10', '100', ''])
    clicar('Valor')
    expect(coluna(2)).toEqual(['100', '10', '9', '2', ''])
  })

  it('coluna sem dado próprio (ações) não ordena', () => {
    render(<DataTable colunas={colunasItem} dados={itens} />)
    expect(screen.queryByRole('button', { name: /^Ações/ })).toBeNull()
  })

  it('com servidor: avisa a tela, que manda para o servidor; só as colunas permitidas', () => {
    const aoOrdenar = vi.fn()
    render(
      <DataTable
        colunas={colunasItem}
        dados={itens}
        ordenaveis={['nome']}
        ordenacao={{ coluna: 'nome', direcao: 'asc' }}
        aoOrdenar={aoOrdenar}
        paginacao={{ page: 1, pageSize: 25, total: 5, aoMudarPagina: vi.fn() }}
      />,
    )
    // A tabela não reordena sozinha: mostra como o servidor mandou.
    expect(coluna(0)).toEqual(['1', '2', '3', '4', '5'])
    expect(screen.queryByRole('button', { name: /^Valor/ })).toBeNull()
    clicar('Nome')
    expect(aoOrdenar).toHaveBeenCalledWith({ coluna: 'nome', direcao: 'desc' })
  })
})

describe('DataTable: linhas por página (R-UX-07)', () => {
  it('escolhe 10, 25, 50 ou 100, guarda a escolha e volta para a primeira página', async () => {
    const aoMudarPagina = vi.fn()
    render(
      <DataTable
        colunas={colunasItem}
        dados={itens}
        paginacao={{ page: 3, pageSize: 25, total: 300, aoMudarPagina }}
      />,
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Linhas por página' }))
    expect(screen.getAllByRole('option').map((opcao) => opcao.textContent)).toEqual([
      '10',
      '25',
      '50',
      '100',
    ])
    await userEvent.click(screen.getByRole('option', { name: '50' }))
    expect(usePreferenciasStore.getState().linhasPorPagina).toBe(50)
    expect(aoMudarPagina).toHaveBeenCalledWith(1)
  })
})
