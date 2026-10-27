import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { carregarOuCriarSegredo, escolherPorta, montarAmbiente } from './runtime'

describe('segredo do login', () => {
  let pasta: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-desktop-'))
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  it('cria um segredo forte na primeira vez e reutiliza nas próximas (R-SEG-08)', () => {
    const primeiro = carregarOuCriarSegredo(join(pasta, 'dados'))
    expect(primeiro.length).toBeGreaterThanOrEqual(32)
    expect(carregarOuCriarSegredo(join(pasta, 'dados'))).toBe(primeiro)
    expect(readFileSync(join(pasta, 'dados', 'segredo.key'), 'utf8')).toBe(primeiro)
  })

  it('troca um segredo curto ou corrompido por um novo', () => {
    writeFileSync(join(pasta, 'segredo.key'), 'curto')
    const novo = carregarOuCriarSegredo(pasta)
    expect(novo).not.toBe('curto')
    expect(novo.length).toBeGreaterThanOrEqual(32)
  })
})

describe('porta', () => {
  it('usa a preferida quando está livre', async () => {
    const sonda = createServer()
    await new Promise<void>((resolve) => sonda.listen(0, '127.0.0.1', resolve))
    const livre = (sonda.address() as { port: number }).port
    await new Promise((resolve) => sonda.close(resolve))

    expect(await escolherPorta(livre)).toBe(livre)
  })

  it('escolhe outra quando a preferida está ocupada', async () => {
    const ocupante = createServer()
    await new Promise<void>((resolve) => ocupante.listen(0, '127.0.0.1', resolve))
    const ocupada = (ocupante.address() as { port: number }).port

    const escolhida = await escolherPorta(ocupada)
    expect(escolhida).not.toBe(ocupada)
    expect(escolhida).toBeGreaterThan(0)
    await new Promise((resolve) => ocupante.close(resolve))
  })
})

describe('ambiente do servidor embutido', () => {
  it('escuta só em 127.0.0.1, em produção e sem Swagger (R-SEG-01)', () => {
    const ambiente = montarAmbiente({
      pastaDados: 'C:/dados',
      pastaInterface: 'C:/client',
      segredo: 'x'.repeat(48),
      porta: 47831,
      versao: '2.1.0',
    })
    expect(ambiente).toMatchObject({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: '47831',
      DATA_DIR: 'C:/dados',
      CLIENT_DIR: 'C:/client',
      SWAGGER_ENABLED: 'false',
      APP_VERSION: '2.1.0',
    })
    expect(ambiente.JWT_SECRET).toHaveLength(48)
  })
})
