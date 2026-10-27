import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clienteDetalhe, clienteListado, pagina } from '../dados'
import { abrirTela, COMUM, esperarCaminho, esperarTitulo, resposta } from '../tela'

const linhas = () => screen.getAllByRole('row').slice(1)

describe('Clientes: lista', () => {
  it('mostra os clientes com CPF formatado e negativado em vermelho', async () => {
    abrirTela('/clientes', {
      api: {
        'GET /clientes': pagina([
          clienteListado(),
          clienteListado({ id: 8, nome: 'Maria Souza', cpf: '', negativado: true }),
        ]),
      },
    })
    await screen.findByText('Maria Souza')
    const [joao, maria] = linhas()
    expect(within(joao as HTMLElement).getByText('123.456.789-01')).toBeInTheDocument()
    expect(maria).toHaveClass('text-destructive')
    expect(joao).not.toHaveClass('text-destructive')
  })

  it('a busca vai para a URL e para o servidor ("Todos" não manda campo; R-CLI-01)', async () => {
    const tela = abrirTela('/clientes', { api: { 'GET /clientes': pagina([]) } })
    fireEvent.change(await screen.findByLabelText('Texto da busca'), {
      target: { value: ' 3199 ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }))

    await waitFor(() => expect(tela.busca()).toMatchObject({ busca: '3199', campo: 'todos' }))
    await waitFor(() => expect(tela.ultimo('GET /clientes').query.get('busca')).toBe('3199'))
    expect(tela.ultimo('GET /clientes').query.has('campo')).toBe(false)
  })

  it('clicar no cabeçalho ordena no servidor e guarda a ordem na URL (R-UX-06)', async () => {
    const tela = abrirTela('/clientes?page=2', {
      api: { 'GET /clientes': pagina([clienteListado()], 60, 2) },
    })
    await screen.findByText('João da Silva')
    expect(tela.ultimo('GET /clientes').query.get('pageSize')).toBe('25')

    fireEvent.click(screen.getByRole('button', { name: /^Nome/ }))
    await waitFor(() => expect(tela.busca()).toMatchObject({ ordem: 'nome', direcao: 'asc' }))
    // A ordem mudou: volta para a primeira página.
    expect(tela.busca().page).toBeUndefined()
    await waitFor(() => expect(tela.ultimo('GET /clientes').query.get('ordem')).toBe('nome'))
    expect(tela.ultimo('GET /clientes').query.get('direcao')).toBe('asc')

    fireEvent.click(screen.getByRole('button', { name: /^Nome/ }))
    await waitFor(() => expect(tela.busca()).toMatchObject({ ordem: 'nome', direcao: 'desc' }))
    // Ações (editar/excluir) não é coluna de dado: não ordena.
    expect(screen.queryByRole('button', { name: /^Ações/ })).toBeNull()
  })

  it('ordem desconhecida na URL é ignorada (não vai ao servidor)', async () => {
    const tela = abrirTela('/clientes?ordem=senha&direcao=lado', {
      api: { 'GET /clientes': pagina([]) },
    })
    await screen.findByText('Nenhum registro encontrado')
    expect(tela.ultimo('GET /clientes').query.has('ordem')).toBe(false)
    expect(tela.ultimo('GET /clientes').query.has('direcao')).toBe(false)
  })

  it('campo inválido na URL é ignorado em vez de virar erro', async () => {
    const tela = abrirTela('/clientes?campo=senha&busca=x', {
      api: { 'GET /clientes': pagina([]) },
    })
    await screen.findByText('Nenhum registro encontrado')
    expect(tela.ultimo('GET /clientes').query.has('campo')).toBe(false)
    expect(tela.ultimo('GET /clientes').query.get('busca')).toBe('x')
  })

  it('pagina no servidor e guarda a página na URL', async () => {
    const tela = abrirTela('/clientes', {
      api: {
        'GET /clientes': ({ query }: { query: URLSearchParams }) =>
          pagina(
            [clienteListado({ nome: `Cliente da página ${query.get('page') ?? 1}` })],
            45,
            Number(query.get('page') ?? 1),
          ),
      },
    })
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    expect(await screen.findByText('Cliente da página 2')).toBeInTheDocument()
    expect(tela.busca().page).toBe(2)
  })

  it('só o administrador exclui, depois de confirmar', async () => {
    const tela = abrirTela('/clientes', {
      api: { 'GET /clientes': pagina([clienteListado()]), 'DELETE /clientes/7': undefined },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir João da Silva?' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('também serão apagados')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(tela.pedidos('DELETE /clientes/7')).toHaveLength(1))
  })

  it('usuário comum não vê o botão de excluir', async () => {
    abrirTela('/clientes', { usuario: COMUM, api: { 'GET /clientes': pagina([clienteListado()]) } })
    await screen.findByText('João da Silva')
    expect(screen.queryByRole('button', { name: 'Excluir João da Silva?' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Editar João da Silva' })).toHaveAttribute(
      'href',
      '/clientes/7',
    )
  })
})

describe('Clientes: cadastro e edição', () => {
  it('cadastrar leva à edição do cliente criado (onde os aparelhos ganham os atalhos de OS)', async () => {
    const tela = abrirTela('/clientes/novo', {
      api: {
        'POST /clientes': clienteDetalhe({ id: 9 }),
        'GET /clientes/9': clienteDetalhe({ id: 9 }),
      },
    })
    await esperarTitulo('Cadastrar cliente')
    // O cadastro já vem com um telefone e um aparelho em branco, que são obrigatórios.
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João da Silva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Informe o telefone')).toBeInTheDocument()
    expect(tela.pedidos('POST /clientes')).toHaveLength(0)

    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '31999991111' } })
    fireEvent.change(screen.getByLabelText('Aparelho'), { target: { value: 'Geladeira' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await esperarCaminho(tela, '/clientes/9')
    expect(tela.ultimo('POST /clientes').corpo).toMatchObject({
      nome: 'João da Silva',
      telefones: [expect.objectContaining({ telefone: '(31) 99999-1111' })],
      aparelhos: [expect.objectContaining({ nome: 'Geladeira' })],
    })
    expect(await screen.findByRole('button', { name: /Gerar OS/ })).toBeInTheDocument()
  })

  it('edição mostra código e data de cadastro e salva as mudanças', async () => {
    const tela = abrirTela('/clientes/7', {
      api: {
        'GET /clientes/7': clienteDetalhe(),
        'PATCH /clientes/7': clienteDetalhe({ nome: 'João da Silva Jr.' }),
      },
    })
    await esperarTitulo('João da Silva')
    expect(screen.getByText('Código 7 · cadastrado em 01/09/2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todas as OS/ })).toHaveAttribute(
      'href',
      '/ordens-servico?clienteId=7',
    )

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João da Silva Jr.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() =>
      expect(tela.ultimo('PATCH /clientes/7').corpo).toMatchObject({ nome: 'João da Silva Jr.' }),
    )
  })

  it('"Gerar OS" abre a nova OS do aparelho (R-CLI-07)', async () => {
    const tela = abrirTela('/clientes/7', { api: { 'GET /clientes/7': clienteDetalhe() } })
    fireEvent.click(await screen.findByRole('button', { name: /Gerar OS/ }))
    await esperarCaminho(tela, '/ordens-servico/nova')
    expect(tela.busca()).toMatchObject({ clienteId: 7, aparelhoId: 3 })
  })

  it('cliente que não existe', async () => {
    abrirTela('/clientes/99', {
      api: { 'GET /clientes/99': resposta(404, { message: 'Cliente não encontrado' }) },
    })
    expect(await esperarTitulo('Cliente não encontrado')).toBeInTheDocument()
  })
})
