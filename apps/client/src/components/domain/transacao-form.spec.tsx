import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TransacaoForm } from '@/models/transacao.model'
import { TransacaoFormulario } from './transacao-form'

const montar = (tipo: 'receita' | 'despesa' = 'receita') => {
  const aoSalvar = vi.fn(async (_valores: TransacaoForm) => undefined)
  render(<TransacaoFormulario tipo={tipo} aoSalvar={aoSalvar} aoCancelar={vi.fn()} />)
  return aoSalvar
}

const preencher = (rotulo: string, valor: string, indice = 0) =>
  fireEvent.change(screen.getAllByLabelText(rotulo)[indice] as HTMLInputElement, {
    target: { value: valor },
  })
const salvar = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

describe('TransacaoFormulario', () => {
  it('título conforme o tipo', () => {
    montar('despesa')
    expect(screen.getByText('Dados da despesa')).toBeInTheDocument()
  })

  it('sem descrição e sem valor, não salva', async () => {
    const aoSalvar = montar()
    salvar()
    expect(await screen.findByText('Informe a descrição')).toBeInTheDocument()
    expect(screen.getByText('Informe o valor')).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()
  })

  it('sem pagamentos, salva só com o valor (entra à vista; R-TRA-01)', async () => {
    const aoSalvar = montar()
    preencher('Descrição', 'Venda de peça')
    preencher('Valor', '100')
    salvar()
    await waitFor(() => expect(aoSalvar).toHaveBeenCalledOnce())
    expect(aoSalvar.mock.calls[0]?.[0]).toMatchObject({
      descricao: 'Venda de peça',
      valor: '100',
      pagamentos: [],
    })
  })

  it('com pagamentos, a soma precisa fechar com o valor (R-TRA-02)', async () => {
    const aoSalvar = montar()
    preencher('Descrição', 'Venda de peça')
    preencher('Valor', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pagamento' }))
    preencher('Valor', '60', 1)
    salvar()
    expect(
      await screen.findByText('A soma dos pagamentos (R$ 60,00) é diferente do valor'),
    ).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()

    preencher('Valor', '100', 1)
    salvar()
    await waitFor(() => expect(aoSalvar).toHaveBeenCalledOnce())
  })
})
