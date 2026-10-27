import type { StatusOS } from '@brastem/shared'

/** Status de OS que ainda pedem trabalho (os do gráfico do Início). */
export const STATUS_EM_ANDAMENTO = [
  'ABERTO',
  'AGUARDANDO',
  'APROVADO',
] as const satisfies StatusOS[]

export interface OsParada {
  id: number
  abertura: string
  status: StatusOS
  clienteId: number
  clienteNome: string
  aparelhoNome: string
  /** Dias desde a abertura. */
  dias: number
}

/** Resumo do Início (GET /api/painel). */
export interface Painel {
  hoje: string
  ordens: {
    emAndamento: Record<(typeof STATUS_EM_ANDAMENTO)[number], number>
    abertasHoje: number
    fechadasNoMes: number
  }
  clientesNovosNoMes: number
  paradas: OsParada[]
  /** Só para o administrador. Centavos. */
  financeiro?: { faturamentoMes: number; caixaMes: number }
}
