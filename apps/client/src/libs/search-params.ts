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
