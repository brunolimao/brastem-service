import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { abrirSqlite, criarDb, type Db, migrarSchema } from '../../common/database/connection.js'
import { schema } from '../../common/database/index.js'
import { recalcularGarantia } from './garantia.js'

const { clientes, aparelhos, ordensServico } = schema

describe('recalcularGarantia', () => {
  let db: Db

  const os = (status: 'FECHADO' | 'ABERTO', fechamento: string | null, dias: number | null) =>
    db
      .insert(ordensServico)
      .values({
        clienteId: 1,
        aparelhoId: 1,
        status,
        abertura: '2026-01-01',
        fechamento,
        garantiaDias: dias,
      })
      .run()
  const garantia = () =>
    db.select({ g: aparelhos.garantiaAte }).from(aparelhos).where(eq(aparelhos.id, 1)).get()?.g

  beforeEach(() => {
    db = criarDb(abrirSqlite(':memory:'))
    migrarSchema(db)
    db.insert(clientes).values({ id: 1, nome: 'Maria' }).run()
    db.insert(aparelhos).values({ id: 1, clienteId: 1, nome: 'Geladeira' }).run()
  })

  it('usa a garantia mais longa entre as OS fechadas (fechamento + dias) (R-GAR-01, R-GAR-02)', () => {
    os('FECHADO', '2026-01-10', 30)
    os('FECHADO', '2026-06-01', 90)
    os('ABERTO', null, null)
    expect(recalcularGarantia(db, 1)).toBe('2026-08-30')
    expect(garantia()).toBe('2026-08-30')
  })

  it('sem OS com garantia, o aparelho fica sem garantia (R-GAR-04)', () => {
    os('FECHADO', '2026-01-10', null)
    expect(recalcularGarantia(db, 1)).toBeNull()
  })

  it('nunca fica abaixo da garantia que veio do sistema antigo (R-GAR-03)', () => {
    db.update(aparelhos)
      .set({ garantiaImportada: '2027-03-01', garantiaAte: '2027-03-01' })
      .where(eq(aparelhos.id, 1))
      .run()
    // Uma OS nova com garantia menor não apaga nem encurta a antiga...
    os('FECHADO', '2026-10-01', 30)
    expect(recalcularGarantia(db, 1)).toBe('2027-03-01')
    // ...mas uma maior vale.
    os('FECHADO', '2026-10-01', 365)
    expect(recalcularGarantia(db, 1)).toBe('2027-10-01')
  })
})
