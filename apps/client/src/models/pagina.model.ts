import type { Direcao } from '@/libs/ordenacao'
/** Resposta paginada das listagens da API. */
export interface Pagina<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** O que toda listagem paginada aceita além dos filtros: página, tamanho e ordem. */
export interface OpcoesDeLista {
  page?: number
  pageSize?: number
  ordem?: string
  direcao?: Direcao
}
