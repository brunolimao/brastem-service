import { addDays, addMonths, format, parseISO } from 'date-fns'

export const ISO_DATE = 'yyyy-MM-dd'
export const DATA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const hoje = () => format(new Date(), ISO_DATE)

export const somarMeses = (data: string, meses: number) =>
  format(addMonths(parseISO(data), meses), ISO_DATE)

export const somarDias = (data: string, dias: number) =>
  format(addDays(parseISO(data), dias), ISO_DATE)
