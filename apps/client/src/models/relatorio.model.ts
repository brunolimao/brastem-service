import type { Recomendacao, StatusOS } from '@brastem/shared'
import type { Periodo } from '@/libs/periodo'

export interface Relatorio {
  periodo: Periodo
  kpis: {
    valorTotal: number
    valorFechado: number
    ordensEmGarantia: number
    totalOrdens: number
    novosClientes: number
  }
  status: Record<StatusOS, number>
  recomendacaoOrdens: Record<Recomendacao, number>
  recomendacaoClientes: Record<Recomendacao, number>
  cidades: { name: string; value: number }[]
  bairros: { name: string; value: number }[]
}

/** Percentual inteiro (0 quando não há base para comparar). */
export const percentual = (parte: number, total: number) =>
  total === 0 ? 0 : Math.round((parte / total) * 100)
