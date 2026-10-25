import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Dinheiro trafega em centavos (inteiro); só vira texto na tela. */
export const formatarMoeda = (centavos: number) => moeda.format(centavos / 100)

/** "150,50" ou "1.250,75" -> centavos. Texto vazio ou inválido vira 0. */
export function reaisParaCentavos(texto: string): number {
  const limpo = texto.trim()
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return normalizado === '' || Number.isNaN(valor) ? 0 : Math.round(valor * 100)
}

/** Centavos -> texto editável ("150,50"), sem símbolo da moeda. */
export const centavosParaReais = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "2026-10-25" -> "25/10/2026". */
export const formatarData = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR }) : '—'

/** ISO completo -> "25/10/2026 14:30". */
export const formatarDataHora = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'

/** Data de hoje no formato que a API usa (yyyy-MM-dd). */
export const hojeIso = () => format(new Date(), 'yyyy-MM-dd')

/** 1536 -> "1,5 KB"; 5242880 -> "5,0 MB". */
export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const unidades = ['KB', 'MB', 'GB']
  let valor = bytes / 1024
  let indice = 0
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024
    indice += 1
  }
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unidades[indice]}`
}

/** "há 3 horas", "há 2 dias". */
export const formatarHa = (iso: string) =>
  formatDistanceToNow(parseISO(iso), { locale: ptBR, addSuffix: true })
