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
