/** Divide um valor em centavos em N parcelas inteiras; o resto da divisão vai para a última. */
export function dividirEmParcelas(totalCentavos: number, quantidade: number): number[] {
  const base = Math.trunc(totalCentavos / quantidade)
  const partes = new Array<number>(quantidade).fill(base)
  partes[quantidade - 1] = (partes[quantidade - 1] ?? 0) + (totalCentavos - base * quantidade)
  return partes
}

/** O mesmo conversor do front ("1.250,50" -> 125050; inválido -> null). */
export { reaisParaCentavos } from '@brastem/shared'
