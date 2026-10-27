import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { empresaVazia } from '@/models/empresa.model'
import { clienteDetalhe, pagina } from '../dados'
import { abrirTela, esperarCaminho, esperarTitulo } from '../tela'

const api = {
  'GET /clientes/7': clienteDetalhe(),
  'PATCH /clientes/7': clienteDetalhe({ nome: 'João da Silva Jr.' }),
  'GET /clientes': pagina([]),
}

const nome = () => screen.getByLabelText('Nome') as HTMLInputElement
const ctrlS = () => fireEvent.keyDown(window, { key: 's', ctrlKey: true })

describe('atalhos de teclado nos formulários (R-UX-08)', () => {
  it('Ctrl+S salva o formulário', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: 'João da Silva Jr.' } })
    nome().focus()
    ctrlS()
    await waitFor(() =>
      expect(tela.ultimo('PATCH /clientes/7').corpo).toMatchObject({ nome: 'João da Silva Jr.' }),
    )
  })

  it('salvar com erro leva o cursor ao primeiro campo errado', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.change(nome(), { target: { value: '' } })
    screen.getByLabelText('Cidade').focus()
    ctrlS()
    expect(await screen.findByText('Informe o nome')).toBeInTheDocument()
    await waitFor(() => expect(document.activeElement).toBe(nome()))
    expect(tela.pedidos('PATCH /clientes/7')).toHaveLength(0)
  })

  it('Esc volta para a lista', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.keyDown(window, { key: 'Escape' })
    await esperarCaminho(tela, '/clientes')
  })

  it('com um diálogo aberto, o Esc só fecha o diálogo', async () => {
    const tela = abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Remover aparelho 1' }))
    const dialogo = screen.getByRole('alertdialog')
    fireEvent.keyDown(dialogo, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(tela.caminho()).toBe('/clientes/7')
  })

  it('com dois formulários na tela, o Ctrl+S salva só aquele onde está o cursor', async () => {
    const tela = abrirTela('/configuracoes', {
      api: {
        'GET /empresa': empresaVazia,
        'PUT /empresa': empresaVazia,
        'GET /backup/estado': {
          google: { configurado: false, conectado: false, email: null, origemCredenciais: null },
          ultimoBackup: null,
          ultimoEnvioDrive: null,
          ultimoErro: null,
          pendenteDrive: false,
          proximoBackup: null,
        },
        'GET /backup/arquivos': { local: [], drive: null, erroDrive: null },
      },
    })
    const empresa = await screen.findByLabelText('Nome da empresa')
    fireEvent.change(empresa, { target: { value: 'Assistência Exemplo' } })
    empresa.focus()
    ctrlS()
    await waitFor(() => expect(tela.pedidos('PUT /empresa')).toHaveLength(1))
    // O formulário das credenciais do Google (vazio) nem foi tentado: nada enviado, nenhum erro mostrado.
    expect(tela.pedidos('POST /backup/google/credenciais')).toHaveLength(0)
    expect(screen.queryByText('Cole o ID do cliente completo')).toBeNull()
  })
})

describe('dicas nos botões de ícone (R-UX-09)', () => {
  it('botão só com ícone mostra o que faz ao parar o mouse', async () => {
    abrirTela('/clientes/7', { api })
    await esperarTitulo('João da Silva')
    expect(screen.getByRole('button', { name: 'Remover aparelho 1' })).toHaveAttribute(
      'title',
      'Remover aparelho 1',
    )
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute(
      'title',
      'Salvar (Ctrl+S)',
    )
  })
})
