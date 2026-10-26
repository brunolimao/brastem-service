import { describe, expect, it } from 'vitest'
import { reaisParaCentavos } from './dinheiro.js'

describe('reaisParaCentavos', () => {
  it.each([
    ['150', 15000],
    ['150,5', 15050],
    ['150,50', 15050],
    ['0,1', 10],
    ['1.250', 125000],
    ['1.250,00', 125000],
    ['1.250,75', 125075],
    ['1.250.000', 125000000],
    ['1250,5', 125050],
    ['150.5', 15050],
    ['150.50', 15050],
    ['R$ 1.250,00', 125000],
    [' 99,90 ', 9990],
    ['-50,00', -5000],
    ['0', 0],
  ])('%s -> %i centavos', (texto, centavos) => {
    expect(reaisParaCentavos(texto)).toBe(centavos)
  })

  it.each(['', 'abc', '1,2,3', '12,345', '1.25.0', '1.2345', '1..250', ',50', '10,'])(
    'recusa %j',
    (texto) => {
      expect(reaisParaCentavos(texto)).toBeNull()
    },
  )
})
