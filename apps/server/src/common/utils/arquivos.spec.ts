import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { moverArquivo } from './arquivos.js'

const erro = (code: string) => Object.assign(new Error(code), { code })

describe('moverArquivo', () => {
  let pasta: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-mover-'))
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  it('renomeia normalmente, substituindo o destino', () => {
    writeFileSync(join(pasta, 'a'), 'novo')
    writeFileSync(join(pasta, 'b'), 'velho')
    moverArquivo(join(pasta, 'a'), join(pasta, 'b'))
    expect(readFileSync(join(pasta, 'b'), 'utf8')).toBe('novo')
    expect(existsSync(join(pasta, 'a'))).toBe(false)
  })

  it('quando o rename dá EXDEV (pasta criptografada), copia e apaga a origem', () => {
    writeFileSync(join(pasta, 'a'), 'conteudo')
    writeFileSync(join(pasta, 'b'), 'velho')
    moverArquivo(join(pasta, 'a'), join(pasta, 'b'), () => {
      throw erro('EXDEV')
    })
    expect(readFileSync(join(pasta, 'b'), 'utf8')).toBe('conteudo')
    expect(existsSync(join(pasta, 'a'))).toBe(false)
  })

  it('outros erros continuam sendo erros (não escondemos problema de verdade)', () => {
    writeFileSync(join(pasta, 'a'), 'x')
    expect(() =>
      moverArquivo(join(pasta, 'a'), join(pasta, 'b'), () => {
        throw erro('EACCES')
      }),
    ).toThrow('EACCES')
    expect(existsSync(join(pasta, 'a'))).toBe(true)
  })
})
