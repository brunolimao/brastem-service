import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from 'date-fns'

export interface Periodo {
  inicio: string
  fim: string
}

const iso = (data: Date) => format(data, 'yyyy-MM-dd')

export const periodoDeHoje = (referencia = new Date()): Periodo => ({
  inicio: iso(referencia),
  fim: iso(referencia),
})

export const periodoDoMes = (referencia = new Date()): Periodo => ({
  inicio: iso(startOfMonth(referencia)),
  fim: iso(endOfMonth(referencia)),
})

export const periodoDoAno = (referencia = new Date()): Periodo => ({
  inicio: iso(startOfYear(referencia)),
  fim: iso(endOfYear(referencia)),
})

/** Período mostrado quando a URL não traz datas: o mês atual. */
export const periodoPadrao = periodoDoMes

/** Usa as datas da URL quando existirem; a que faltar vem do período padrão. */
export const resolverPeriodo = (
  inicio?: string,
  fim?: string,
  referencia = new Date(),
): Periodo => {
  const padrao = periodoPadrao(referencia)
  return { inicio: inicio ?? padrao.inicio, fim: fim ?? padrao.fim }
}
