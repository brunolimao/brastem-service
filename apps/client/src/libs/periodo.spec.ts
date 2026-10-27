import { describe, expect, it } from 'vitest'
import { periodoDeHoje, periodoDoAno, periodoDoMes, resolverPeriodo } from './periodo'

const referencia = new Date(2026, 9, 25) // 25/10/2026

describe('períodos', () => {
  it('hoje', () => {
    expect(periodoDeHoje(referencia)).toEqual({ inicio: '2026-10-25', fim: '2026-10-25' })
  })

  it('mês inclui o último dia (31 em outubro, 28 em fevereiro de ano não bissexto)', () => {
    expect(periodoDoMes(referencia)).toEqual({ inicio: '2026-10-01', fim: '2026-10-31' })
    expect(periodoDoMes(new Date(2026, 1, 10))).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' })
  })

  it('ano', () => {
    expect(periodoDoAno(referencia)).toEqual({ inicio: '2026-01-01', fim: '2026-12-31' })
  })

  it('usa as datas da URL e completa a que faltar com o mês atual (R-CX-02, R-REL-06, R-PAG-06)', () => {
    expect(resolverPeriodo('2026-09-01', '2026-09-15', referencia)).toEqual({
      inicio: '2026-09-01',
      fim: '2026-09-15',
    })
    expect(resolverPeriodo('2026-09-01', undefined, referencia)).toEqual({
      inicio: '2026-09-01',
      fim: '2026-10-31',
    })
    expect(resolverPeriodo(undefined, undefined, referencia)).toEqual(periodoDoMes(referencia))
  })
})
