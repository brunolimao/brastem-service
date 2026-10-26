import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type Coluna, DataTable } from './data-table'

interface Pessoa {
  id: number
  nome: string
}

const colunas: Coluna<Pessoa>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
]

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

  it('sem paginação do servidor, a própria tabela pagina de 20 em 20', async () => {
    const muitos = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, nome: `Pessoa ${i + 1}` }))
    render(<DataTable colunas={colunas} dados={muitos} />)

    expect(screen.getByText('45 resultados')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('Pessoa 20')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 21')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument()
    expect(screen.getByText('Pessoa 45')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 40')).toBeNull()
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
