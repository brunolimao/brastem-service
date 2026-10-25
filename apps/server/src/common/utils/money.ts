/** Divide um valor em centavos em N parcelas inteiras; o resto da divisão vai para a última. */
export function dividirEmParcelas(totalCentavos: number, quantidade: number): number[] {
  const base = Math.trunc(totalCentavos / quantidade)
  const partes = new Array<number>(quantidade).fill(base)
  partes[quantidade - 1] = (partes[quantidade - 1] ?? 0) + (totalCentavos - base * quantidade)
  return partes
}

/** "150,50" ou "150.50" -> 15050. Retorna null se não for um número. */
export function reaisParaCentavos(texto: string): number | null {
  const limpo = texto.trim()
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return normalizado === '' || Number.isNaN(valor) ? null : Math.round(valor * 100)
}
