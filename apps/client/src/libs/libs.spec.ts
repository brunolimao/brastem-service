import { describe, expect, it } from 'vitest'
import {
  centavosParaReais,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  reaisParaCentavos,
} from './formatters'
import { mascararCep, mascararCpfCnpj, mascararTelefone } from './masks'
import { textoDeBusca } from './search-params'

describe('máscaras', () => {
  it.each([
    ['12345678901', '123.456.789-01'],
    ['123456', '123.456'],
    ['12345678000199', '12.345.678/0001-99'],
    ['abc123', '123'],
  ])('CPF/CNPJ %s -> %s', (entrada, esperado) => {
    expect(mascararCpfCnpj(entrada)).toBe(esperado)
  })

  it.each([
    ['', ''],
    ['3', '(3'],
    ['31', '(31'],
    ['319999', '(31) 9999'],
    ['3133334444', '(31) 3333-4444'],
    ['31999991111', '(31) 99999-1111'],
    ['3199999111122', '(31) 99999-1111'],
  ])('telefone %s -> %s', (entrada, esperado) => {
    expect(mascararTelefone(entrada)).toBe(esperado)
  })

  it('CEP', () => {
    expect(mascararCep('31910520')).toBe('31910-520')
    expect(mascararCep('319')).toBe('319')
  })
})

describe('formatadores', () => {
  it('formata centavos como moeda brasileira', () => {
    expect(formatarMoeda(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56')
    expect(formatarMoeda(-5000).replace(/\s/g, ' ')).toBe('-R$ 50,00')
  })

  it('converte texto em reais para centavos e volta', () => {
    expect(reaisParaCentavos('150,50')).toBe(15050)
    expect(reaisParaCentavos('1.250,75')).toBe(125075)
    expect(reaisParaCentavos('abc')).toBe(0)
    expect(centavosParaReais(15050)).toBe('150,50')
  })

  it('formata datas no padrão brasileiro', () => {
    expect(formatarData('2026-10-25')).toBe('25/10/2026')
    expect(formatarData(null)).toBe('—')
    expect(formatarDataHora('2026-10-25T14:30:00')).toBe('25/10/2026 14:30')
  })
})

describe('textoDeBusca', () => {
  it('aceita texto e número (a URL converte "99999" em número) e devolve sempre texto', () => {
    expect(textoDeBusca.parse('maria')).toBe('maria')
    expect(textoDeBusca.parse(99999)).toBe('99999')
    expect(textoDeBusca.parse(undefined)).toBeUndefined()
    expect(textoDeBusca.parse({ qualquer: 'coisa' })).toBeUndefined()
  })
})
