import { describe, expect, it } from 'vitest'
import { somarDias, somarMeses } from './dates.js'
import { dividirEmParcelas, reaisParaCentavos } from './money.js'

describe('dividirEmParcelas', () => {
  it('divide igualmente quando é exato', () => {
    expect(dividirEmParcelas(30000, 3)).toEqual([10000, 10000, 10000])
  })

  it('joga o resto dos centavos na última parcela e mantém a soma', () => {
    const partes = dividirEmParcelas(10000, 3)
    expect(partes).toEqual([3333, 3333, 3334])
    expect(partes.reduce((a, b) => a + b, 0)).toBe(10000)
  })

  it('funciona com valores negativos (despesas)', () => {
    const partes = dividirEmParcelas(-10000, 3)
    expect(partes.reduce((a, b) => a + b, 0)).toBe(-10000)
  })
})

describe('reaisParaCentavos', () => {
  it.each([
    ['150,50', 15050],
    ['1.250,75', 125075],
    ['150.5', 15050],
    ['150', 15000],
  ])('converte %s', (texto, esperado) => {
    expect(reaisParaCentavos(texto)).toBe(esperado)
  })

  it('retorna null para texto inválido ou vazio', () => {
    expect(reaisParaCentavos('abc')).toBeNull()
    expect(reaisParaCentavos('')).toBeNull()
  })
})

describe('datas', () => {
  it('soma meses sem estourar o fim do mês', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28')
    expect(somarMeses('2026-10-01', 3)).toBe('2027-01-01')
  })

  it('soma dias', () => {
    expect(somarDias('2026-10-01', 90)).toBe('2026-12-30')
  })
})
