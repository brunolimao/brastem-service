import { and, eq } from 'drizzle-orm'
import { type DbLike, schema } from '../../common/database/index.js'
import { somarDias } from '../../common/utils/dates.js'

const { ordensServico, aparelhos } = schema

/**
 * A garantia do aparelho vai até o fim da garantia mais longa entre as OS fechadas dele
 * (fechamento + dias), e nunca abaixo da que veio do sistema antigo (`garantiaImportada`).
 * Recalcular, em vez de sobrescrever, evita que editar uma OS antiga encurte a garantia dada por uma
 * mais nova, e faz apagar a garantia de uma OS valer de verdade. Roda dentro da transação de quem chama.
 */
export function recalcularGarantia(db: DbLike, aparelhoId: number) {
  const aparelho = db
    .select({ importada: aparelhos.garantiaImportada })
    .from(aparelhos)
    .where(eq(aparelhos.id, aparelhoId))
    .get()
  const fins = db
    .select({ fechamento: ordensServico.fechamento, dias: ordensServico.garantiaDias })
    .from(ordensServico)
    .where(and(eq(ordensServico.aparelhoId, aparelhoId), eq(ordensServico.status, 'FECHADO')))
    .all()
    .flatMap(({ fechamento, dias }) => (fechamento && dias ? [somarDias(fechamento, dias)] : []))
  if (aparelho?.importada) fins.push(aparelho.importada)
  fins.sort()

  db.update(aparelhos)
    .set({ garantiaAte: fins.at(-1) ?? null })
    .where(eq(aparelhos.id, aparelhoId))
    .run()
  return fins.at(-1) ?? null
}
