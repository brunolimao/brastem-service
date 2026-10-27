import type { EChartsOption } from 'echarts'

export interface FatiaGrafico {
  name: string
  value: number
}

/** Variáveis do tema usadas, em ordem, pelas fatias (ver `--chart-*` no `index.css`). */
export const PALETA_PADRAO = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
]

/** As mesmas cores em hex, usadas onde o tema não pode ser lido (testes). */
export const RESERVA_PADRAO = [
  '#5b8def',
  '#ee6666',
  '#3ba272',
  '#fac858',
  '#9a60b4',
  '#73c0de',
  '#ea7ccc',
]

/**
 * As maiores fatias e, se sobrar, uma "Outros" com a soma do resto. Mantém o total certo (antes as
 * cidades além da 7ª sumiam do gráfico e do total) sem uma legenda gigante.
 */
export function agruparMenores(dados: FatiaGrafico[], maximo = 7): FatiaGrafico[] {
  const ordenados = [...dados].sort((a, b) => b.value - a.value)
  if (ordenados.length <= maximo) return ordenados
  const principais = ordenados.slice(0, maximo - 1)
  const resto = ordenados.slice(maximo - 1).reduce((soma, fatia) => soma + fatia.value, 0)
  return [...principais, { name: 'Outros', value: resto }]
}

/** Cores já resolvidas (#rrggbb) do tema atual. */
export interface CoresGrafico {
  fatias: string[]
  texto: string
  suave: string
  fundo: string
}

/**
 * Rosca com o total no centro. A legenda fica fora do gráfico (em HTML, embaixo), para quebrar linha em
 * vez de cobrir a rosca. Fatias zeradas ficam de fora.
 */
export function montarOpcaoPizza(dados: FatiaGrafico[], cores: CoresGrafico): EChartsOption {
  const fatias = fatiasColoridas(dados, cores.fatias).filter((fatia) => fatia.value > 0)
  const total = fatias.reduce((soma, fatia) => soma + fatia.value, 0)

  return {
    color: cores.fatias,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    title: {
      text: String(total),
      subtext: 'Total',
      left: 'center',
      top: '38%',
      textStyle: { color: cores.texto, fontSize: 26 },
      subtextStyle: { color: cores.suave },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: cores.fundo, borderWidth: 2 },
        label: { show: false },
        data: fatias,
      },
    ],
  }
}

/** A cor é fixada antes de filtrar, para cada fatia manter a sua mesmo quando outras zeram. */
export const fatiasColoridas = (dados: FatiaGrafico[], cores: string[]) =>
  dados.map((fatia, indice) => ({
    ...fatia,
    itemStyle: { color: cores[indice % cores.length] as string },
  }))
