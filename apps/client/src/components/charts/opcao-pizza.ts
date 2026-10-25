import type { EChartsOption } from 'echarts'

export interface FatiaGrafico {
  name: string
  value: number
}

/** Cores que funcionam no claro e no escuro (as mesmas do sistema antigo, com verde/âmbar/roxo extras). */
export const PALETA_PADRAO = [
  '#5b8def',
  '#ee6666',
  '#3ba272',
  '#fac858',
  '#9a60b4',
  '#73c0de',
  '#ea7ccc',
]

interface OpcaoPizza {
  dados: FatiaGrafico[]
  escuro: boolean
  cores?: string[]
}

/** Rosca com o total no centro. Fatias zeradas ficam de fora para não poluir a legenda. */
export function montarOpcaoPizza({
  dados,
  escuro,
  cores = PALETA_PADRAO,
}: OpcaoPizza): EChartsOption {
  // A cor é fixada antes de filtrar, para cada fatia manter a sua mesmo quando outras zeram.
  const fatias = dados
    .map((fatia, indice) => ({ ...fatia, itemStyle: { color: cores[indice % cores.length] } }))
    .filter((fatia) => fatia.value > 0)
  const total = fatias.reduce((soma, fatia) => soma + fatia.value, 0)
  const texto = escuro ? '#e5e7eb' : '#1f2937'
  const suave = escuro ? '#9ca3af' : '#6b7280'

  return {
    color: cores,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: texto } },
    title: {
      text: String(total),
      subtext: 'Total',
      left: 'center',
      top: '36%',
      textStyle: { color: texto, fontSize: 26 },
      subtextStyle: { color: suave },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: escuro ? '#111827' : '#ffffff', borderWidth: 2 },
        label: { show: false },
        data: fatias,
      },
    ],
  }
}
