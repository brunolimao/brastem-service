import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { escolherPastaDeCache, pastaAceitaRenomear } from './cache-atualizacao'

describe('pastaAceitaRenomear', () => {
  let base: string

  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'brastem-cache-'))
  })

  afterEach(() => {
    rmSync(base, { recursive: true, force: true })
  })

  it('aceita uma pasta comum (criando-a se preciso) e não deixa lixo', () => {
    const pasta = join(base, 'nova', 'cache')
    expect(pastaAceitaRenomear(pasta)).toBe(true)
    expect(existsSync(pasta)).toBe(true)
    expect(readdirSync(pasta)).toEqual([])
  })

  it('recusa quando não dá para criar arquivos ali (um arquivo no lugar da pasta)', () => {
    const arquivo = join(base, 'eu-sou-um-arquivo')
    writeFileSync(arquivo, 'x')
    expect(pastaAceitaRenomear(arquivo)).toBe(false)
  })
})

describe('escolherPastaDeCache (R-ATU-08)', () => {
  it('usa a primeira candidata que funciona, respeitando a ordem de preferência', () => {
    const testadas: string[] = []
    const escolhida = escolherPastaDeCache(['A', 'B', 'C'], (pasta) => {
      testadas.push(pasta)
      return pasta !== 'A'
    })
    expect(escolhida).toBe('B')
    expect(testadas).toEqual(['A', 'B'])
  })

  it('mantém a padrão quando ela funciona (o comportamento normal não muda)', () => {
    expect(escolherPastaDeCache(['padrao', 'outra'], () => true)).toBe('padrao')
  })

  it('devolve undefined quando nenhuma funciona e ignora candidatas vazias', () => {
    expect(escolherPastaDeCache(['A', 'B'], () => false)).toBeUndefined()
    const testadas: string[] = []
    escolherPastaDeCache(['', 'B'], (pasta) => {
      testadas.push(pasta)
      return true
    })
    expect(testadas).toEqual(['B'])
  })
})
