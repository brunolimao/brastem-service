/**
 * Cor real (#rrggbb) de uma variável do tema (ex.: `--chart-1`), para quem desenha fora do CSS (os
 * gráficos usam canvas). Mudar a variável no `index.css` muda o gráfico também.
 *
 * O CSS guarda as cores em oklch; o navegador converte ao pintar um pixel, e é esse pixel que é lido.
 * Onde não há canvas (testes), devolve a `reserva`.
 */
export function corDoTema(variavel: string, reserva: string): string {
  if (typeof document === 'undefined' || navigator.userAgent.includes('jsdom')) return reserva
  const valor = getComputedStyle(document.documentElement).getPropertyValue(variavel).trim()
  if (!valor) return reserva

  const contexto = pintor()
  if (!contexto) return reserva
  contexto.clearRect(0, 0, 1, 1)
  contexto.fillStyle = reserva
  contexto.fillStyle = valor
  contexto.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = contexto.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}

let contextoPintor: CanvasRenderingContext2D | null | undefined

const pintor = () => {
  contextoPintor ??= Object.assign(document.createElement('canvas'), {
    width: 1,
    height: 1,
  }).getContext('2d', { willReadFrequently: true })
  return contextoPintor
}
