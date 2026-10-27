import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caixa, itemCaixa, pagamentoListado, pagina, relatorio } from '../dados'
import { abrirTela, COMUM, esperarCaminho, esperarTitulo } from '../tela'

// "Hoje" fixo: 15/10/2026. Só o relógio de datas é falso (os temporizadores seguem reais).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 10, 0))
})
afterEach(() => vi.useRealTimers())

const OUTUBRO = { inicio: '2026-10-01', fim: '2026-10-31' }
const periodoPedido = (pedido: { query: URLSearchParams }) => ({
  inicio: pedido.query.get('inicio'),
  fim: pedido.query.get('fim'),
})

describe('Caixa (R-CX-01 a R-CX-04)', () => {
  const gasolina = itemCaixa({
    id: 2,
    valor: -3000,
    tipo: 'dinheiro',
    ordemServicoId: null,
    transacaoId: 5,
    categoria: 'transporte',
    descricao: 'Gasolina',
  })

  it('sem datas na URL, mostra o mês atual com o saldo e as movimentações', async () => {
    const tela = abrirTela('/caixa', { api: { 'GET /caixa': caixa([itemCaixa(), gasolina]) } })
    await esperarTitulo('Caixa')
    expect(await screen.findByText('R$ 320,00')).toBeInTheDocument()
    expect(screen.getByText('2 movimentações')).toBeInTheDocument()
    expect(periodoPedido(tela.ultimo('GET /caixa'))).toEqual(OUTUBRO)

    const [daOs, despesa] = screen.getAllByRole('row').slice(1) as HTMLElement[]
    expect(within(daOs as HTMLElement).getByRole('link', { name: 'OS 42' })).toHaveAttribute(
      'href',
      '/ordens-servico/42',
    )
    expect(despesa).toHaveClass('text-destructive')
    expect(within(despesa as HTMLElement).getByText(/Transporte/)).toBeInTheDocument()
  })

  it('período sem movimento sugere lançar receita ou despesa (R-UX-10)', async () => {
    abrirTela('/caixa', { api: { 'GET /caixa': caixa([]) } })
    expect(await screen.findByText('Nenhuma movimentação neste período')).toBeInTheDocument()
    const tabela = screen.getByRole('table')
    expect(within(tabela).getByRole('link', { name: /Lançar receita/ })).toHaveAttribute(
      'href',
      '/caixa/receita',
    )
    expect(within(tabela).getByRole('link', { name: /Lançar despesa/ })).toBeInTheDocument()
  })

  it('saldo negativo fica em vermelho', async () => {
    abrirTela('/caixa', { api: { 'GET /caixa': caixa([gasolina]) } })
    // O mesmo valor aparece no saldo (parágrafo grande) e na linha da tabela.
    const valores = await screen.findAllByText('-R$ 30,00')
    expect(valores.find((elemento) => elemento.tagName === 'P')).toHaveClass('text-destructive')
  })

  it('atalho "Ano" vai para a URL e para o servidor', async () => {
    const tela = abrirTela('/caixa', { api: { 'GET /caixa': caixa([]) } })
    fireEvent.click(await screen.findByRole('button', { name: 'Ano' }))
    await waitFor(() =>
      expect(tela.busca()).toMatchObject({ inicio: '2026-01-01', fim: '2026-12-31' }),
    )
    await waitFor(() =>
      expect(periodoPedido(tela.ultimo('GET /caixa'))).toEqual({
        inicio: '2026-01-01',
        fim: '2026-12-31',
      }),
    )
  })

  it('só lançamento avulso tem excluir; excluir pede confirmação (R-TRA-05)', async () => {
    const tela = abrirTela('/caixa', {
      api: { 'GET /caixa': caixa([itemCaixa(), gasolina]), 'DELETE /transacoes/5': undefined },
    })
    await screen.findByText('Gasolina')
    expect(screen.getAllByRole('button', { name: /^Excluir o lançamento/ })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir o lançamento "Gasolina"?' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(tela.pedidos('DELETE /transacoes/5')).toHaveLength(1))
  })
})

describe('Lançar receita e despesa', () => {
  const lancar = async (tela: ReturnType<typeof abrirTela>, titulo: string) => {
    await esperarTitulo(titulo)
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Avulso' } })
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(tela.pedidos('POST /transacoes')).toHaveLength(1))
  }

  it('administrador lança a receita e vai para o caixa', async () => {
    const tela = abrirTela('/caixa/receita', {
      api: { 'POST /transacoes': { id: 1 }, 'GET /caixa': caixa([]) },
    })
    await lancar(tela, 'Lançar receita')
    expect(tela.ultimo('POST /transacoes').corpo).toEqual({
      tipo: 'receita',
      categoria: 'venda',
      data: '2026-10-15',
      descricao: 'Avulso',
      observacao: '',
      valor: 10000,
    })
    await esperarCaminho(tela, '/caixa')
  })

  it('usuário comum lança a despesa e volta para o início (não vê o caixa)', async () => {
    const tela = abrirTela('/caixa/despesa', {
      usuario: COMUM,
      api: { 'POST /transacoes': { id: 1 } },
    })
    await lancar(tela, 'Lançar despesa')
    expect(tela.ultimo('POST /transacoes').corpo).toMatchObject({
      tipo: 'despesa',
      categoria: 'transporte',
    })
    await esperarCaminho(tela, '/')
  })

  it('Voltar não lança nada', async () => {
    const tela = abrirTela('/caixa/receita', { api: { 'GET /caixa': caixa([]) } })
    await esperarTitulo('Lançar receita')
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await esperarCaminho(tela, '/caixa')
    expect(tela.pedidos('POST /transacoes')).toHaveLength(0)
  })
})

describe('Pagamentos', () => {
  it('sem datas na URL consulta o mês atual; forma e busca da URL vão para o servidor', async () => {
    const tela = abrirTela('/pagamentos?tipo=pix&campo=todos&busca=350', {
      api: { 'GET /pagamentos': pagina([pagamentoListado()]) },
    })
    await screen.findByText('R$ 350,00')
    const pedido = tela.ultimo('GET /pagamentos')
    expect(periodoPedido(pedido)).toEqual(OUTUBRO)
    expect(pedido.query.get('tipo')).toBe('pix')
    expect(pedido.query.get('busca')).toBe('350')
    expect(pedido.query.has('campo')).toBe(false)
  })

  it('mostra a origem (OS ou lançamento) e as parcelas de cada pagamento', async () => {
    abrirTela('/pagamentos', {
      api: {
        'GET /pagamentos': pagina([
          pagamentoListado(),
          pagamentoListado({ id: 2, parcelas: 0, ordemServicoId: null, transacaoId: 5 }),
        ]),
        'GET /pagamentos/1/parcelas': [
          { id: 1, pagamentoId: 1, numero: 1, data: '2026-11-01', valor: 11667 },
          { id: 2, pagamentoId: 1, numero: 2, data: '2026-12-01', valor: 11667 },
          { id: 3, pagamentoId: 1, numero: 3, data: '2027-01-01', valor: 11666 },
        ],
      },
    })
    expect(await screen.findByRole('link', { name: 'OS 42' })).toBeInTheDocument()
    expect(screen.getByText('Lançamento 5')).toBeInTheDocument()
    expect(screen.getByText('3x')).toBeInTheDocument()
    expect(screen.getByText('À vista')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ver parcelas do pagamento 1' }))
    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByText('01/01/2027')).toBeInTheDocument()
    expect(within(dialogo).getAllByText('R$ 116,67')).toHaveLength(2)
  })
})

describe('Relatórios', () => {
  it('mostra os indicadores do período e os gráficos', async () => {
    const tela = abrirTela('/relatorios?inicio=2026-10-01&fim=2026-10-31', {
      api: { 'GET /relatorios': relatorio() },
    })
    expect(await screen.findByText('R$ 1.500,00')).toBeInTheDocument()
    expect(
      screen.getByText(/de R\$ 2\.000,00 em ordens fora de garantia \(75%\)/),
    ).toBeInTheDocument()
    expect(screen.getByText('de 8 ordens (25%)')).toBeInTheDocument()
    expect(screen.getByText('cadastrados no período')).toBeInTheDocument()
    expect(screen.getAllByTestId('grafico')).toHaveLength(5)
    expect(periodoPedido(tela.ultimo('GET /relatorios'))).toEqual(OUTUBRO)
  })
})
