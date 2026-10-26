import { describe, expect, it } from 'vitest'
import {
  CATEGORIAS_DESPESA,
  CATEGORIAS_RECEITA,
  RECOMENDACOES,
  ROLES,
  STATUS_OS,
  TIPOS_PAGAMENTO,
  TIPOS_TRANSACAO,
} from './index.js'

/**
 * Estes valores ficam gravados no banco de cada loja e vêm do sistema antigo na importação.
 * Renomear ou tirar um deles deixa dados já gravados sem sentido (e a importação quebra): para mudar,
 * é preciso uma migração que converta o que está no banco. Acrescentar um valor novo é seguro.
 */
describe('valores gravados no banco não mudam', () => {
  it.each([
    ['ROLES', ROLES, ['admin', 'usuario']],
    ['STATUS_OS', STATUS_OS, ['ABERTO', 'AGUARDANDO', 'APROVADO', 'FECHADO', 'CANCELADO']],
    [
      'TIPOS_PAGAMENTO',
      TIPOS_PAGAMENTO,
      ['dinheiro', 'debito', 'credito', 'pix', 'parcelado', 'cheque', 'boleto', 'transferencia'],
    ],
    ['RECOMENDACOES', RECOMENDACOES, ['antigo', 'indicacao', 'internet', 'porta', 'outros']],
    ['TIPOS_TRANSACAO', TIPOS_TRANSACAO, ['receita', 'despesa']],
    ['CATEGORIAS_RECEITA', CATEGORIAS_RECEITA, ['venda', 'gorjeta', 'outros']],
    [
      'CATEGORIAS_DESPESA',
      CATEGORIAS_DESPESA,
      ['transporte', 'peca', 'loja', 'materiais', 'outros'],
    ],
  ])('%s contém todos os valores já usados', (_nome, lista, gravados) => {
    for (const valor of gravados) expect(lista).toContain(valor)
  })

  it.each([
    ['ROLES', ROLES],
    ['STATUS_OS', STATUS_OS],
    ['TIPOS_PAGAMENTO', TIPOS_PAGAMENTO],
    ['RECOMENDACOES', RECOMENDACOES],
    ['TIPOS_TRANSACAO', TIPOS_TRANSACAO],
    ['CATEGORIAS_RECEITA', CATEGORIAS_RECEITA],
    ['CATEGORIAS_DESPESA', CATEGORIAS_DESPESA],
  ] as const)('%s sem repetidos nem vazios', (_nome, lista: readonly string[]) => {
    expect(new Set(lista).size).toBe(lista.length)
    expect(lista.every((valor) => valor.trim() === valor && valor !== '')).toBe(true)
  })
})
