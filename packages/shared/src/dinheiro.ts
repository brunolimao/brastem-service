const COM_VIRGULA = /^(\d{1,3}(?:\.\d{3})+|\d+),(\d{1,2})$/
const SO_MILHAR = /^\d{1,3}(?:\.\d{3})+$/
const PONTO_DECIMAL = /^(\d+)\.(\d{1,2})$/
const INTEIRO = /^\d+$/

/**
 * Texto em reais (como o usuário digita) para centavos. Devolve `null` se não for um valor válido.
 *
 * Segue o costume brasileiro: vírgula é decimal e ponto é milhar ("1.250,50" e "1.250" valem mil
 * duzentos e cinquenta). Ponto só vira decimal com 1 ou 2 casas e sem vírgula ("150.5", "150.50"),
 * porque valores antigos e colados de outros lugares chegam assim. Aceita "R$" e sinal negativo.
 */
export function reaisParaCentavos(texto: string): number | null {
  let limpo = texto.replace(/R\$/i, '').replace(/\s/g, '')
  const negativo = limpo.startsWith('-')
  if (negativo) limpo = limpo.slice(1)

  let reais: string
  let centavos = '0'
  const comVirgula = COM_VIRGULA.exec(limpo)
  const pontoDecimal = PONTO_DECIMAL.exec(limpo)
  if (comVirgula) {
    reais = (comVirgula[1] ?? '').replaceAll('.', '')
    centavos = comVirgula[2] ?? '0'
  } else if (SO_MILHAR.test(limpo)) {
    reais = limpo.replaceAll('.', '')
  } else if (pontoDecimal) {
    reais = pontoDecimal[1] ?? ''
    centavos = pontoDecimal[2] ?? '0'
  } else if (INTEIRO.test(limpo)) {
    reais = limpo
  } else {
    return null
  }

  // Inteiros, sem ponto flutuante: "0,1" são 10 centavos, não 1.
  const total = Number(reais) * 100 + Number(centavos.padEnd(2, '0'))
  return negativo && total !== 0 ? -total : total
}
