import { z } from 'zod'

/**
 * Texto de busca na URL. O roteador converte "99999" em número ao ler a query,
 * então o schema aceita as duas formas e devolve sempre texto.
 */
export const textoDeBusca = z
  .union([z.string(), z.number()])
  .transform(String)
  .optional()
  .catch(undefined)

export const numeroPositivo = z.number().int().min(1).optional().catch(undefined)

/** Data no formato da API (yyyy-MM-dd); qualquer outra coisa na URL é ignorada. */
export const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const buscaDePeriodo = z.object({ inicio: dataIso, fim: dataIso })

/**
 * Um dos valores de uma lista fixa (ex.: campo de busca). Qualquer outra coisa digitada na URL vira
 * "sem filtro" em vez de ir para o server e voltar como erro 400.
 */
export const umDos = <const T extends readonly { valor: string }[]>(opcoes: T) =>
  z
    .enum(opcoes.map((opcao) => opcao.valor) as [T[number]['valor'], ...T[number]['valor'][]])
    .optional()
    .catch(undefined)
