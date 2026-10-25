import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { aplicarRestauracaoPendente, NOME_RESTAURACAO_PENDENTE } from './connection.js'

const criarBanco = (caminho: string, valor: string) => {
  const banco = new Database(caminho)
  banco.exec('create table t (v text)')
  banco.prepare('insert into t values (?)').run(valor)
  banco.close()
}

const ler = (caminho: string) => {
  const banco = new Database(caminho, { readonly: true })
  const { v } = banco.prepare('select v from t').get() as { v: string }
  banco.close()
  return v
}

describe('aplicarRestauracaoPendente', () => {
  let pasta: string
  let banco: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-restauracao-'))
    banco = join(pasta, 'brastem.sqlite')
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  it('não faz nada sem restauração pendente', () => {
    criarBanco(banco, 'atual')
    expect(aplicarRestauracaoPendente(banco)).toBe(false)
    expect(ler(banco)).toBe('atual')
  })

  it('troca o banco pelo pendente e guarda o antigo em backups/antes-da-restauracao-*', () => {
    criarBanco(banco, 'atual')
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')

    expect(aplicarRestauracaoPendente(banco, new Date(2026, 9, 25, 14, 30, 5))).toBe(true)

    expect(ler(banco)).toBe('restaurado')
    expect(existsSync(join(pasta, NOME_RESTAURACAO_PENDENTE))).toBe(false)
    const guardado = join(pasta, 'backups', 'antes-da-restauracao-2026-10-25-143005.sqlite')
    expect(ler(guardado)).toBe('atual')
  })

  it('leva junto o -wal do banco antigo e descarta o -wal velho no lugar do novo', () => {
    criarBanco(banco, 'atual')
    writeFileSync(`${banco}-wal`, 'dados do banco antigo')
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')

    aplicarRestauracaoPendente(banco, new Date(2026, 9, 25, 14, 30, 5))

    expect(existsSync(`${banco}-wal`)).toBe(false)
    expect(readdirSync(join(pasta, 'backups'))).toContain(
      'antes-da-restauracao-2026-10-25-143005.sqlite-wal',
    )
  })

  it('instala o pendente mesmo quando ainda não existe banco', () => {
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')
    expect(aplicarRestauracaoPendente(banco)).toBe(true)
    expect(ler(banco)).toBe('restaurado')
  })

  it('ignora o banco em memória', () => {
    expect(aplicarRestauracaoPendente(':memory:')).toBe(false)
  })
})
