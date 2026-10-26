import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { clienteDetalhe, ordemDetalhe, ordemListada, pagina } from '../dados'
import { abrirTela, COMUM, esperarCaminho, esperarTitulo, resposta } from '../tela'

describe('Ordens de serviço: lista', () => {
  it('valor mostrado inclui a taxa de deslocamento; cliente negativado em vermelho', async () => {
    abrirTela('/ordens-servico', {
      api: {
        'GET /ordens-servico': pagina([
          ordemListada(),
          ordemListada({ id: 43, status: 'ABERTO', clienteNegativado: true, solucionado: '' }),
        ]),
      },
    })
    await screen.findAllByText('João da Silva')
    const [fechada, aberta] = screen.getAllByRole('row').slice(1) as HTMLElement[]
    expect(within(fechada as HTMLElement).getByText('R$ 350,00')).toBeInTheDocument()
    expect(within(fechada as HTMLElement).getByText('Fechado')).toBeInTheDocument()
    expect(
      within(fechada as HTMLElement).getByRole('link', { name: 'João da Silva' }),
    ).toHaveAttribute('href', '/clientes/7')
    expect(aberta).toHaveClass('text-destructive')
  })

  it('filtrada por aparelho: avisa e "Ver todas" tira o filtro', async () => {
    const tela = abrirTela('/ordens-servico?aparelhoId=3', {
      api: { 'GET /ordens-servico': pagina([ordemListada()]) },
    })
    expect(
      await screen.findByText('Mostrando só as ordens do cliente ou aparelho escolhido.'),
    ).toBeInTheDocument()
    expect(tela.ultimo('GET /ordens-servico').query.get('aparelhoId')).toBe('3')

    fireEvent.click(screen.getByRole('button', { name: /Ver todas/ }))
    await waitFor(() => expect(tela.busca().aparelhoId).toBeUndefined())
    await waitFor(() =>
      expect(tela.ultimo('GET /ordens-servico').query.has('aparelhoId')).toBe(false),
    )
  })

  it('a busca mantém o filtro do aparelho e volta para a primeira página (R-OS-06)', async () => {
    const tela = abrirTela('/ordens-servico?aparelhoId=3&page=2', {
      api: { 'GET /ordens-servico': pagina([ordemListada()], 30, 2) },
    })
    fireEvent.change(await screen.findByLabelText('Texto da busca'), {
      target: { value: '2026-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }))
    await waitFor(() =>
      expect(tela.busca()).toMatchObject({ aparelhoId: 3, busca: '2026-10', campo: 'todos' }),
    )
    expect(tela.busca().page).toBeUndefined()
  })

  it('administrador exclui depois de confirmar; usuário comum não vê o botão (R-OS-09)', async () => {
    const tela = abrirTela('/ordens-servico', {
      api: {
        'GET /ordens-servico': pagina([ordemListada()]),
        'DELETE /ordens-servico/42': undefined,
      },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir a OS 42?' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(tela.pedidos('DELETE /ordens-servico/42')).toHaveLength(1))

    abrirTela('/ordens-servico', {
      usuario: COMUM,
      api: { 'GET /ordens-servico': pagina([ordemListada({ id: 50 })]) },
    })
    await screen.findByRole('link', { name: 'Editar OS 50' })
    expect(screen.queryByRole('button', { name: 'Excluir a OS 50?' })).toBeNull()
  })
})

describe('Ordens de serviço: gerar', () => {
  it('sem cliente e aparelho na URL, manda escolher na tela do cliente', async () => {
    abrirTela('/ordens-servico/nova')
    expect(
      await screen.findByText('Escolha o aparelho na tela do cliente para gerar a OS.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para os clientes' })).toHaveAttribute(
      'href',
      '/clientes',
    )
  })

  it('gera a OS do aparelho escolhido e volta para a lista dele (R-OS-01)', async () => {
    const tela = abrirTela('/ordens-servico/nova?clienteId=7&aparelhoId=3', {
      api: {
        'GET /clientes/7': clienteDetalhe(),
        'POST /ordens-servico': ordemDetalhe(),
        'GET /ordens-servico': pagina([ordemListada()]),
      },
    })
    await esperarTitulo('Gerar ordem de serviço')
    expect(screen.getByText('Geladeira', { exact: false })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '300' } })
    fireEvent.change(screen.getByLabelText('Problema relatado'), { target: { value: 'Não gela' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await esperarCaminho(tela, '/ordens-servico')
    expect(tela.busca()).toMatchObject({ aparelhoId: 3 })
    expect(tela.ultimo('POST /ordens-servico').corpo).toMatchObject({
      clienteId: 7,
      aparelhoId: 3,
      valor: 30000,
      relatado: 'Não gela',
      status: 'ABERTO',
      fechamento: null,
      garantiaDias: null,
    })
  })
})

describe('Ordens de serviço: editar e imprimir', () => {
  it('mostra os outros serviços do aparelho e salva voltando para a lista dele', async () => {
    const tela = abrirTela('/ordens-servico/42', {
      api: {
        'GET /ordens-servico/42': ordemDetalhe(),
        'PATCH /ordens-servico/42': ordemDetalhe(),
        'GET /ordens-servico': pagina([ordemListada()]),
      },
    })
    await esperarTitulo('Ordem de serviço 42')
    expect(screen.getByText('Últimos serviços neste aparelho')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /OS 30 · 10\/01\/2025/ })).toHaveAttribute(
      'href',
      '/ordens-servico/30',
    )
    // A própria OS não aparece entre os "últimos serviços".
    expect(screen.queryByRole('link', { name: /OS 42 ·/ })).toBeNull()

    fireEvent.change(screen.getByLabelText('Garantia (dias)'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await esperarCaminho(tela, '/ordens-servico')
    // Esvaziar a garantia manda null: o servidor limpa o campo (R-OS-04).
    expect(tela.ultimo('PATCH /ordens-servico/42').corpo).toMatchObject({
      garantiaDias: null,
      valor: 30000,
      taxaDeslocamento: 5000,
      pagamentos: [expect.objectContaining({ valor: 35000, tipo: 'credito', parcelas: 3 })],
    })
  })

  it('Imprimir sem alterações abre a impressão; lá, o botão chama a impressora', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const tela = abrirTela('/ordens-servico/42', {
      api: { 'GET /ordens-servico/42': ordemDetalhe() },
    })
    await esperarTitulo('Ordem de serviço 42')
    fireEvent.click(screen.getByRole('button', { name: /Imprimir/ }))
    await esperarCaminho(tela, '/ordens-servico/42/imprimir')
    expect(tela.pedidos('PATCH /ordens-servico/42')).toHaveLength(0)

    expect(await screen.findByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/ordens-servico/42',
    )
    expect(screen.getAllByText(/Troca do compressor/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Imprimir/ }))
    expect(imprimir).toHaveBeenCalledOnce()
  })

  it('OS que não existe', async () => {
    abrirTela('/ordens-servico/99', {
      api: {
        'GET /ordens-servico/99': resposta(404, { message: 'Ordem de serviço não encontrada' }),
      },
    })
    expect(await esperarTitulo('Ordem de serviço não encontrada')).toBeInTheDocument()
  })
})
