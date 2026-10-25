/** Resposta paginada das listagens da API. */
export interface Pagina<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
