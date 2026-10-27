import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GraficoPizza } from './grafico-pizza'
import { agruparMenores, montarOpcaoPizza } from './opcao-pizza'

// O echarts desenha em canvas, que o jsdom não tem; aqui só conferimos o que é entregue a ele.
vi.mock('echarts-for-react/lib/core', () => ({
  default: ({ option }: { option: unknown }) => (
    <div data-testid="echarts" data-option={JSON.stringify(option)} />
  ),
}))

type Serie = { data: { name: string; value: number; itemStyle: { color: string } }[] }

const serieDe = (opcao: ReturnType<typeof montarOpcaoPizza>) =>
  (opcao.series as Serie[])[0] as Serie

const CORES = {
  fatias: ['#111111', '#222222', '#333333'],
  texto: '#000001',
  suave: '#000002',
  fundo: '#000003',
}

describe('montarOpcaoPizza', () => {
  it('descarta fatias zeradas e mantém a cor de cada uma pelo lugar original', () => {
    const opcao = montarOpcaoPizza(
      [
        { name: 'Aberto', value: 0 },
        { name: 'Fechado', value: 5 },
        { name: 'Cancelado', value: 2 },
      ],
      CORES,
    )
    const fatias = serieDe(opcao).data
    expect(fatias.map((f) => f.name)).toEqual(['Fechado', 'Cancelado'])
    expect(fatias.map((f) => f.itemStyle.color)).toEqual(['#222222', '#333333'])
  })

  it('mostra o total no centro com as cores do tema e não desenha legenda dentro do gráfico', () => {
    const opcao = montarOpcaoPizza(
      [
        { name: 'A', value: 3 },
        { name: 'B', value: 4 },
      ],
      CORES,
    )
    const titulo = opcao.title as { text: string; textStyle: { color: string } }
    expect(titulo.text).toBe('7')
    expect(titulo.textStyle.color).toBe('#000001')
    // A legenda dentro do canvas cobria a rosca quando os nomes eram longos (foto do relatório de bairros).
    expect(opcao.legend).toBeUndefined()
  })
})

describe('GraficoPizza', () => {
  it('avisa quando não há dados no período', () => {
    render(<GraficoPizza titulo="Ordens por status" dados={[{ name: 'Aberto', value: 0 }]} />)
    expect(screen.getByText('Sem dados no período')).toBeInTheDocument()
    expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
  })

  it('legenda embaixo do gráfico, com quantidade e porcentagem, sem as fatias zeradas', () => {
    render(
      <GraficoPizza
        titulo="Clientes novos por bairro"
        dados={[
          { name: 'Fernão Dias', value: 3 },
          { name: 'São Paulo', value: 1 },
          { name: 'Vazio', value: 0 },
        ]}
      />,
    )
    expect(screen.getByTestId('echarts')).toBeInTheDocument()
    const legenda = screen.getByRole('list', { name: 'Legenda: Clientes novos por bairro' })
    expect(
      within(legenda)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Fernão Dias375%', 'São Paulo125%'])
  })
})

describe('agruparMenores', () => {
  const cidades = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ name: `Cidade ${i + 1}`, value: n - i }))

  it('com até 7 itens, mostra todos (do maior para o menor)', () => {
    expect(agruparMenores(cidades(3)).map((f) => f.name)).toEqual([
      'Cidade 1',
      'Cidade 2',
      'Cidade 3',
    ])
  })

  it('com mais, junta o resto em "Outros" sem perder nada do total', () => {
    const dados = cidades(10)
    const agrupado = agruparMenores(dados)
    expect(agrupado).toHaveLength(7)
    expect(agrupado.at(-1)).toEqual({ name: 'Outros', value: 4 + 3 + 2 + 1 })
    const total = (lista: { value: number }[]) => lista.reduce((s, f) => s + f.value, 0)
    expect(total(agrupado)).toBe(total(dados))
  })
})
