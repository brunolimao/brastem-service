import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aparelhoVazio, clienteVazio } from '@/models/cliente.model'
import { TEMPO_LIMITE_CEP_MS } from '@/services/viacep.service'
import { ClienteFormulario } from './cliente-form'

const navegar = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navegar }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

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
    // Espera a validação terminar (a mensagem aparece) em vez de esperar um tempo fixo.
    expect(await screen.findByText('Informe o nome')).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()
    expect(navegar).not.toHaveBeenCalled()
  })
})

describe('ClienteFormulario: mensagens de erro (R-UX-18)', () => {
  it('passar pelo Nome sem digitar e ir para outro campo não acusa erro; salvar acusa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    )
    const aoSalvar = vi.fn(async () => undefined)
    render(
      <ClienteFormulario
        valoresIniciais={clienteVazio()}
        aoSalvar={aoSalvar}
        aoCancelar={vi.fn()}
      />,
    )
    // O Nome começa com o cursor; sair dele para o CEP o marcava como "mexido".
    fireEvent.blur(screen.getByLabelText('Nome'))
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '23' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a' } })
    await waitFor(() => expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid'))
    expect(screen.queryByText('Informe o nome')).toBeNull()

    // E-mail vazio de novo: o campo de e-mail do navegador barraria o envio antes do formulário.
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))
    expect(await screen.findByText('Informe o nome')).toBeInTheDocument()
    expect(aoSalvar).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('ClienteFormulario: endereço pelo CEP (R-CLI-02)', () => {
  /** ViaCEP falso: cada CEP fica pendente até o teste responder. */
  const respostas = new Map<string, (corpo: object) => void>()
  const pedidos: { url: string; signal?: AbortSignal | null }[] = []

  beforeEach(() => {
    respostas.clear()
    pedidos.length = 0
    vi.mocked(toast.error).mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        pedidos.push({ url, signal: init?.signal })
        return new Promise((resolver) => {
          respostas.set(url.split('/')[4] ?? '', (corpo) =>
            resolver(new Response(JSON.stringify(corpo))),
          )
        })
      }),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const digitarCep = (cep: string) =>
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: cep } })
  const valor = (rotulo: string) => (screen.getByLabelText(rotulo) as HTMLInputElement).value
  const responder = async (cep: string, logradouro: string) => {
    await act(async () => {
      respostas.get(cep)?.({ logradouro, bairro: 'Centro', localidade: 'Lavras', uf: 'mg' })
    })
  }

  it('preenche endereço, bairro, cidade e UF; a consulta tem tempo limite', async () => {
    renderizar()
    digitarCep('37200000')
    await responder('37200000', 'Rua A')
    expect(valor('Endereço')).toBe('RUA A')
    expect(valor('Cidade')).toBe('LAVRAS')
    expect(valor('UF')).toBe('MG')
    expect(pedidos[0]?.signal).toBeInstanceOf(AbortSignal)
    expect(TEMPO_LIMITE_CEP_MS).toBe(8000)
  })

  it('descarta a resposta de um CEP que já foi trocado na tela', async () => {
    renderizar()
    digitarCep('37200000')
    digitarCep('37200001')
    await responder('37200001', 'Rua Nova')
    await responder('37200000', 'Rua Velha')
    expect(valor('Endereço')).toBe('RUA NOVA')
  })

  it('sem resposta a tempo, avisa que não deu para consultar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('tempo esgotado', 'TimeoutError'))),
    )
    renderizar()
    digitarCep('37200000')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível consultar o CEP'),
    )
    expect(valor('Endereço')).toBe('')
  })
})
