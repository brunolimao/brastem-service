import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type OrdemServicoForm, ordemServicoVazia } from '@/models/ordem-servico.model'
import { OrdemServicoFormulario } from './ordem-servico-form'

const montar = (valores: Partial<OrdemServicoForm> = {}, comImprimir = false) => {
  const aoSalvar = vi.fn(async (_valores: OrdemServicoForm) => undefined)
  const aoConcluir = vi.fn()
  const aoImprimir = vi.fn()
  render(
    <OrdemServicoFormulario
      valoresIniciais={{ ...ordemServicoVazia(), abertura: '2026-10-01', ...valores }}
      aoSalvar={aoSalvar}
      aoCancelar={vi.fn()}
      aoConcluir={aoConcluir}
      aoImprimir={comImprimir ? aoImprimir : undefined}
    />,
  )
  return { aoSalvar, aoConcluir, aoImprimir }
}

const campo = (rotulo: string) => screen.getByLabelText(rotulo) as HTMLInputElement
const salvar = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

describe('OrdemServicoFormulario: o que aparece', () => {
  it('OS aberta sem taxa: sem fechamento, garantia nem pagamentos', () => {
    montar()
    expect(screen.queryByLabelText('Fechado em')).toBeNull()
    expect(screen.queryByLabelText('Garantia (dias)')).toBeNull()
    expect(screen.queryByText('Pagamentos')).toBeNull()
  })

  it('OS fechada mostra solução, fechamento, garantia e pagamentos', () => {
    montar({ status: 'FECHADO', fechamento: '2026-10-10' })
    expect(campo('Problema solucionado')).toBeInTheDocument()
    expect(campo('Fechado em').value).toBe('2026-10-10')
    expect(campo('Garantia (dias)')).toBeInTheDocument()
    expect(screen.getByText('Pagamentos')).toBeInTheDocument()
  })

  it('taxa de deslocamento faz aparecer os pagamentos mesmo com a OS aberta', () => {
    montar()
    fireEvent.change(campo('Taxa de deslocamento'), { target: { value: '50' } })
    expect(screen.getByText('Pagamentos')).toBeInTheDocument()
  })

  it('garantia aceita só números', () => {
    montar({ status: 'FECHADO', fechamento: '2026-10-10' })
    fireEvent.change(campo('Garantia (dias)'), { target: { value: '9o dias' } })
    expect(campo('Garantia (dias)').value).toBe('9')
  })
})

describe('OrdemServicoFormulario: salvar', () => {
  it('OS fechada sem data de fechamento não salva (R-OS-02)', async () => {
    const { aoSalvar } = montar({ status: 'FECHADO' })
    salvar()
    expect(await screen.findByText('Informe a data de fechamento')).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()
  })

  it('salva o que está na tela e depois conclui', async () => {
    const { aoSalvar, aoConcluir } = montar()
    fireEvent.change(campo('Valor'), { target: { value: '1.250' } })
    fireEvent.change(campo('Problema relatado'), { target: { value: 'Não gela' } })
    salvar()
    await waitFor(() => expect(aoConcluir).toHaveBeenCalledOnce())
    expect(aoSalvar).toHaveBeenCalledWith(
      expect.objectContaining({ valor: '1.250', relatado: 'Não gela', status: 'ABERTO' }),
    )
  })

  it('pagamento adicionado entra no que é salvo e pode ser removido', async () => {
    const { aoSalvar } = montar({ status: 'FECHADO', fechamento: '2026-10-10' })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pagamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pagamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover pagamento 2' }))
    expect(screen.queryByRole('button', { name: 'Remover pagamento 2' })).toBeNull()

    fireEvent.change(screen.getAllByLabelText('Valor')[1] as HTMLInputElement, {
      target: { value: '80' },
    })
    salvar()
    await waitFor(() => expect(aoSalvar).toHaveBeenCalledOnce())
    expect(aoSalvar.mock.calls[0]?.[0].pagamentos).toEqual([
      expect.objectContaining({ valor: '80' }),
    ])
  })
})

describe('OrdemServicoFormulario: Imprimir (R-OS-08)', () => {
  it('sem alterações, imprime direto', () => {
    const { aoSalvar, aoImprimir } = montar({}, true)
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }))
    expect(aoImprimir).toHaveBeenCalledOnce()
    expect(aoSalvar).not.toHaveBeenCalled()
  })

  it('com alterações, salva antes e imprime em vez de voltar para a lista', async () => {
    const { aoSalvar, aoImprimir, aoConcluir } = montar({}, true)
    fireEvent.change(campo('Observação'), { target: { value: 'Cliente pediu urgência' } })
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }))
    await waitFor(() => expect(aoImprimir).toHaveBeenCalledOnce())
    expect(aoSalvar).toHaveBeenCalledWith(
      expect.objectContaining({ observacao: 'Cliente pediu urgência' }),
    )
    expect(aoSalvar.mock.invocationCallOrder[0]).toBeLessThan(
      aoImprimir.mock.invocationCallOrder[0] ?? 0,
    )
    expect(aoConcluir).not.toHaveBeenCalled()
  })

  it('com erro no formulário, não salva nem imprime', async () => {
    const { aoSalvar, aoImprimir } = montar({ status: 'FECHADO', fechamento: '2026-10-10' }, true)
    fireEvent.change(campo('Fechado em'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }))
    expect(await screen.findByText('Informe a data de fechamento')).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()
    expect(aoImprimir).not.toHaveBeenCalled()
  })
})
