import { z } from 'zod'

export type Direcao = 'asc' | 'desc'

/** Coluna e sentido em que uma tabela está ordenada. */
export interface Ordenacao {
  coluna: string
  direcao: Direcao
}

/** Clique no cabeçalho: crescente → decrescente → sem ordem (volta ao padrão da lista). */
export function proximaOrdenacao(
  atual: Ordenacao | undefined,
  coluna: string,
): Ordenacao | undefined {
  if (atual?.coluna !== coluna) return { coluna, direcao: 'asc' }
  return atual.direcao === 'asc' ? { coluna, direcao: 'desc' } : undefined
}

const vazio = (valor: unknown) => valor === null || valor === undefined || valor === ''
const comparadorDeTexto = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

/** Compara dois valores de uma coluna: números como números, textos em ordem do português (acentos e
 * maiúsculas juntos, "10" depois de "9"). Vazios vão sempre para o fim, nos dois sentidos. */
export function compararValores(a: unknown, b: unknown, direcao: Direcao): number {
  if (vazio(a) || vazio(b)) return vazio(a) === vazio(b) ? 0 : vazio(a) ? 1 : -1
  const sinal = direcao === 'asc' ? 1 : -1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * sinal
  if (typeof a === 'boolean' && typeof b === 'boolean') return (Number(a) - Number(b)) * sinal
  return comparadorDeTexto.compare(String(a), String(b)) * sinal
}

/** Ordena uma cópia das linhas pela coluna (chave do objeto); sem ordenação, devolve como veio. */
export function ordenarLinhas<T>(linhas: T[], ordenacao: Ordenacao | undefined): T[] {
  if (!ordenacao) return linhas
  const valor = (linha: T) => (linha as Record<string, unknown>)[ordenacao.coluna]
  return [...linhas].sort((a, b) => compararValores(valor(a), valor(b), ordenacao.direcao))
}

/**
 * Ordem na URL das listas que ordenam no servidor: só aceita as colunas da lista (`colunas`), o resto
 * vira "sem ordem" em vez de ir ao servidor e voltar como erro.
 */
export const ordenacaoNaUrl = <const T extends readonly string[]>(colunas: T) => ({
  ordem: z
    .enum(colunas as unknown as [T[number], ...T[number][]])
    .optional()
    .catch(undefined),
  direcao: z.enum(['asc', 'desc']).optional().catch(undefined),
})

/** Da URL para a tabela. */
export const ordenacaoDaUrl = (busca: { ordem?: string; direcao?: Direcao }) =>
  busca.ordem ? { coluna: busca.ordem, direcao: busca.direcao ?? 'asc' } : undefined

/** Da tabela para a URL, só com colunas da lista (volta para a primeira página: a ordem mudou). */
export const urlDaOrdenacao = <C extends string>(
  ordenacao: Ordenacao | undefined,
  colunas: readonly C[],
) => ({
  ordem: colunas.find((coluna) => coluna === ordenacao?.coluna),
  direcao: ordenacao?.direcao,
  page: undefined,
})
