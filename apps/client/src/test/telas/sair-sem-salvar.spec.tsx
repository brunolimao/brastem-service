import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clienteDetalhe, ordemListada, pagina } from '../dados'
import { abrirTela, esperarCaminho, esperarTitulo } from '../tela'

const api = {
  'GET /clientes/7': clienteDetalhe(),
  'PATCH /clientes/7': clienteDetalhe({ nome: 'João da Silva Jr.' }),
  'GET /clientes': pagina([]),
  'GET /ordens-servico': pagina([ordemListada()]),
}

const nome = () => screen.getByLabelText('Nome') as HTMLInputElement
const irParaOrdens = () => fireEvent.click(screen.getByRole('link', { name: 'Ordens de serviço' }))
const aviso = () => screen.queryByRole('alertdialog', { name: 'Sair sem salvar?' })

describe('sair sem salvar (R-UX-02)', () => {
  it('com alteração não salva, pergunta antes de trocar de tela', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: 'João da Silva Jr.' } })

    irParaOrdens()
    expect(await screen.findByRole('alertdialog', { name: 'Sair sem salvar?' })).toBeInTheDocument()
    expect(tela.caminho()).toBe('/clientes/7')

    // Continuar editando: fica na tela, com o que foi digitado.
    fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }))
    await waitFor(() => expect(aviso()).toBeNull())
    expect(nome().value).toBe('João da Silva Jr.')

    // Sair sem salvar: troca de tela e nada é enviado.
    irParaOrdens()
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Sair sem salvar',
      }),
    )
    await esperarCaminho(tela, '/ordens-servico')
    expect(tela.pedidos('PATCH /clientes/7')).toHaveLength(0)
  })

  it('o botão Voltar do formulário também pergunta', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: 'Outro nome' } })
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('alertdialog', { name: 'Sair sem salvar?' })).toBeInTheDocument()
    expect(tela.caminho()).toBe('/clientes/7')
  })

  it('desfazer a mudança à mão conta como sem alteração: troca de tela direto', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: 'Outro' } })
    fireEvent.change(nome(), { target: { value: 'João da Silva' } })
    irParaOrdens()
    await esperarCaminho(tela, '/ordens-servico')
    expect(aviso()).toBeNull()
  })

  it('depois de salvar, troca de tela direto', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: 'João da Silva Jr.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(tela.pedidos('PATCH /clientes/7')).toHaveLength(1))

    irParaOrdens()
    await esperarCaminho(tela, '/ordens-servico')
    expect(aviso()).toBeNull()
  })
})
