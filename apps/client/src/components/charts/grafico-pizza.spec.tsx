import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GraficoPizza } from './grafico-pizza'
import { montarOpcaoPizza } from './opcao-pizza'

// O echarts desenha em canvas, que o jsdom não tem; aqui só conferimos o que é entregue a ele.
vi.mock('echarts-for-react/lib/core', () => ({
  default: ({ option }: { option: unknown }) => (
    <div data-testid="echarts" data-option={JSON.stringify(option)} />
  ),
}))

type Serie = { data: { name: string; value: number; itemStyle: { color: string } }[] }

const serieDe = (opcao: ReturnType<typeof montarOpcaoPizza>) =>
  (opcao.series as Serie[])[0] as Serie

describe('montarOpcaoPizza', () => {
  it('descarta fatias zeradas e mantém a cor de cada uma pelo lugar original', () => {
    const opcao = montarOpcaoPizza({
      dados: [
        { name: 'Aberto', value: 0 },
        { name: 'Fechado', value: 5 },
        { name: 'Cancelado', value: 2 },
      ],
      escuro: false,
      cores: ['#111111', '#222222', '#333333'],
    })

    const fatias = serieDe(opcao).data
    expect(fatias.map((f) => f.name)).toEqual(['Fechado', 'Cancelado'])
    expect(fatias.map((f) => f.itemStyle.color)).toEqual(['#222222', '#333333'])
  })

  it('mostra o total no centro e adapta o texto ao tema escuro', () => {
    const claro = montarOpcaoPizza({
      dados: [
        { name: 'A', value: 3 },
        { name: 'B', value: 4 },
      ],
      escuro: false,
    })
    const escuro = montarOpcaoPizza({
      dados: [
        { name: 'A', value: 3 },
        { name: 'B', value: 4 },
      ],
      escuro: true,
    })

    expect((claro.title as { text: string }).text).toBe('7')
    expect((claro.legend as { textStyle: { color: string } }).textStyle.color).not.toBe(
      (escuro.legend as { textStyle: { color: string } }).textStyle.color,
    )
  })
})

describe('GraficoPizza', () => {
  it('avisa quando não há dados no período', () => {
    render(<GraficoPizza titulo="Ordens por status" dados={[{ name: 'Aberto', value: 0 }]} />)
    expect(screen.getByText('Sem dados no período')).toBeInTheDocument()
    expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
  })

  it('renderiza o gráfico e uma lista em texto para leitores de tela', () => {
    render(
      <GraficoPizza
        titulo="Ordens por status"
        dados={[
          { name: 'Aberto', value: 3 },
          { name: 'Fechado', value: 0 },
        ]}
      />,
    )
    expect(screen.getByTestId('echarts')).toBeInTheDocument()
    expect(screen.getByText('Aberto: 3')).toBeInTheDocument()
    expect(screen.getByText('Fechado: 0')).toBeInTheDocument()
  })
})
