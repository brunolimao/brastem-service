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
