import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aparelhoVazio, clienteVazio } from '@/models/cliente.model'
import { ClienteFormulario } from './cliente-form'

const navegar = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navegar }))

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

describe('ClienteFormulario: atalhos de OS salvam antes de sair', () => {
  const montar = () => {
    const aoSalvar = vi.fn(async () => undefined)
    const valores = clienteVazio()
    valores.nome = 'Maria'
    valores.telefones = []
    valores.aparelhos = [{ ...aparelhoVazio(), id: 5, nome: 'Geladeira' }]
    render(
      <ClienteFormulario
        valoresIniciais={valores}
        clienteId={7}
        aoSalvar={aoSalvar}
        aoCancelar={vi.fn()}
      />,
    )
    return aoSalvar
  }

  beforeEach(() => navegar.mockReset())

  it('sem alteração, só navega', () => {
    const aoSalvar = montar()
    fireEvent.click(screen.getByRole('button', { name: /Gerar OS/ }))
    expect(aoSalvar).not.toHaveBeenCalled()
    expect(navegar).toHaveBeenCalledWith({
      to: '/ordens-servico/nova',
      search: { clienteId: 7, aparelhoId: 5 },
    })
  })

  it('com alteração pendente, salva e depois navega (como no sistema antigo)', async () => {
    const aoSalvar = montar()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.click(screen.getByRole('button', { name: /Ver OS/ }))

    await waitFor(() => expect(navegar).toHaveBeenCalled())
    expect(aoSalvar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Maria Souza' }))
    expect(navegar).toHaveBeenCalledWith({ to: '/ordens-servico', search: { aparelhoId: 5 } })
  })

  it('com erro no formulário, não salva nem sai da tela', async () => {
    const aoSalvar = montar()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Gerar OS/ }))
    await new Promise((resolver) => setTimeout(resolver, 50))
    expect(aoSalvar).not.toHaveBeenCalled()
    expect(navegar).not.toHaveBeenCalled()
  })
})
