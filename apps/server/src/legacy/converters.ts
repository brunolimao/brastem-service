import {
  RECOMENDACOES,
  type Recomendacao,
  STATUS_OS,
  type StatusOS,
  TIPOS_PAGAMENTO,
  type TipoPagamento,
} from '@brastem/shared'
import type { ValorLegado } from './dump-parser.js'

export const texto = (valor: ValorLegado | undefined) => (valor == null ? '' : String(valor).trim())

export const inteiro = (valor: ValorLegado | undefined): number | null => {
  const n = Number.parseInt(texto(valor), 10)
  return Number.isNaN(n) ? null : n
}

/**
 * "150", "116.66666666666667", "150,50" ou "1.250,75" -> centavos. Vazio ou inválido vira 0.
 * Diferente do que o usuário digita: o sistema antigo gravava números do JavaScript, em que o ponto é
 * decimal (para ele "1.250" era 1,25 nas contas), então aqui ponto só é milhar se houver vírgula.
 */
export function dinheiroParaCentavos(valor: ValorLegado | undefined): number {
  const bruto = texto(valor)
  const normalizado = bruto.includes(',') ? bruto.replace(/\./g, '').replace(',', '.') : bruto
  const numero = Number(normalizado)
  return normalizado === '' || Number.isNaN(numero) ? 0 : Math.round(numero * 100)
}

/** Aceita "yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss" e "dd/MM/yyyy"; qualquer outra coisa vira null. */
export function dataParaIso(valor: ValorLegado | undefined): string | null {
  const bruto = texto(valor)
  const iso = bruto.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const br = bruto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return null
}

/**
 * "2024-02-14 10:30:00" -> ISO em UTC. O sistema antigo gravava no horário de Brasília
 * (Sequelize com `timezone: '-03:00'`), então 22h de lá são 01h do dia seguinte em UTC.
 */
export function dataHoraParaIso(valor: ValorLegado | undefined): string {
  const match = texto(valor).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
  return match ? new Date(`${match[1]}T${match[2]}-03:00`).toISOString() : new Date(0).toISOString()
}

export const simOuNao = (valor: ValorLegado | undefined) =>
  ['sim', 'true', '1', 'on'].includes(texto(valor).toLowerCase())

const pertence = <T extends string>(lista: readonly T[], valor: string): valor is T =>
  (lista as readonly string[]).includes(valor)

/** Como o relatório antigo: status desconhecido contava como APROVADO. */
export function statusLegado(valor: ValorLegado | undefined): {
  valor: StatusOS
  reconhecido: boolean
} {
  const normalizado = texto(valor).toUpperCase()
  return pertence(STATUS_OS, normalizado)
    ? { valor: normalizado, reconhecido: true }
    : { valor: 'APROVADO', reconhecido: false }
}

/** Como o relatório antigo: recomendação desconhecida contava como "porta". */
export function recomendacaoLegado(valor: ValorLegado | undefined): Recomendacao {
  const normalizado = texto(valor).toLowerCase()
  return pertence(RECOMENDACOES, normalizado) ? normalizado : 'porta'
}

/** Como o relatório antigo: forma de pagamento desconhecida contava como "cheque". */
export function tipoPagamentoLegado(valor: ValorLegado | undefined): {
  valor: TipoPagamento
  reconhecido: boolean
} {
  const normalizado = texto(valor).toLowerCase()
  return pertence(TIPOS_PAGAMENTO, normalizado)
    ? { valor: normalizado, reconhecido: true }
    : { valor: 'cheque', reconhecido: false }
}
