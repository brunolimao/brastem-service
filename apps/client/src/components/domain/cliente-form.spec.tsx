import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { aparelhoVazio, clienteVazio } from '@/models/cliente.model'
import { ClienteFormulario } from './cliente-form'

const renderizar = () => {
  const valores = clienteVazio()
  // Um aparelho já salvo (tem id) e um novo, ainda só no formulário.
  valores.aparelhos = [
    { ...aparelhoVazio(), id: 5, nome: 'Geladeira' },
    { ...aparelhoVazio(), nome: 'Fogão' },
  ]
  render(
    <ClienteFormulario
      valoresIniciais={valores}
      aoSalvar={vi.fn(async () => undefined)}
      aoCancelar={vi.fn()}
    />,
  )
}

const aparelhosNaTela = () =>
  screen.getAllByLabelText('Aparelho').map((campo) => (campo as HTMLInputElement).value)

describe('ClienteFormulario: remover aparelho', () => {
  it('aparelho novo sai na hora, sem pergunta', () => {
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: 'Remover aparelho 2' }))
    expect(aparelhosNaTela()).toEqual(['Geladeira'])
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('aparelho salvo pede confirmação avisando que as OS e os pagamentos vão junto', () => {
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: 'Remover aparelho 1' }))

    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo.textContent).toContain('ordens de serviço e pagamentos')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(aparelhosNaTela()).toEqual(['Geladeira', 'Fogão'])

    fireEvent.click(screen.getByRole('button', { name: 'Remover aparelho 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(aparelhosNaTela()).toEqual(['Fogão'])
  })
})
