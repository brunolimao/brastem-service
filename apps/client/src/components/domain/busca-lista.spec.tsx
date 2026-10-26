import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BuscaLista } from './busca-lista'

const CAMPOS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'nome', rotulo: 'Nome' },
] as const

const texto = () => screen.getByLabelText('Texto da busca') as HTMLInputElement

describe('BuscaLista', () => {
  it('sem campo na URL, busca em "Todos" e manda o texto sem espaços nas pontas', () => {
    const aoBuscar = vi.fn()
    render(<BuscaLista campos={CAMPOS} campo={undefined} busca={undefined} aoBuscar={aoBuscar} />)

    fireEvent.change(texto(), { target: { value: '  maria  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }))

    expect(aoBuscar).toHaveBeenCalledExactlyOnceWith({ campo: 'todos', busca: 'maria' })
  })

  it('mostra o campo e o texto que vieram da URL', () => {
    render(<BuscaLista campos={CAMPOS} campo="nome" busca="joão" aoBuscar={vi.fn()} />)
    expect(texto().value).toBe('joão')
    expect(screen.getByLabelText('Buscar em').textContent).toBe('Nome')
  })

  it('acompanha a URL quando ela muda por fora (voltar do navegador, "Ver todas")', () => {
    const { rerender } = render(
      <BuscaLista campos={CAMPOS} campo="nome" busca="joão" aoBuscar={vi.fn()} />,
    )
    fireEvent.change(texto(), { target: { value: 'digitado e não enviado' } })

    rerender(<BuscaLista campos={CAMPOS} campo={undefined} busca={undefined} aoBuscar={vi.fn()} />)

    expect(texto().value).toBe('')
    expect(screen.getByLabelText('Buscar em').textContent).toBe('Todos')
  })
})
