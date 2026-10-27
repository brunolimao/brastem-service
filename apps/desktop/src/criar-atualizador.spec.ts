import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NsisUpdater } from 'electron-updater'
import { ElectronAppAdapter } from 'electron-updater/out/ElectronAppAdapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarAtualizador } from './criar-atualizador'

// `electron.app` de mentira: só o que o electron-updater lê ao ser criado.
const appFalso = {
  getVersion: () => '2.0.2',
  getName: () => 'Brastem-Service',
  getPath: () => 'C:/qualquer',
  getAppPath: () => 'C:/qualquer',
  isPackaged: true,
  whenReady: async () => undefined,
  quit: vi.fn(),
  relaunch: vi.fn(),
  once: vi.fn(),
} as never

type Interno = { httpExecutor: unknown; app: { baseCachePath: string } }

describe('criarAtualizador', () => {
  let base: string

  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'brastem-atualizador-'))
  })

  afterEach(() => {
    rmSync(base, { recursive: true, force: true })
  })

  it('pula a pasta que não aceita renomear e guarda o cache na seguinte (R-ATU-08)', () => {
    // Um arquivo no lugar da pasta faz o teste de rename falhar, como uma pasta criptografada (EFS) faria.
    const recusa = join(base, 'nao-e-pasta')
    writeFileSync(recusa, 'x')
    const boa = join(base, 'boa')
    const registrar = vi.fn()

    const atualizador = criarAtualizador([recusa, boa], registrar, appFalso)

    expect((atualizador as unknown as Interno).app.baseCachePath).toBe(boa)
    expect(registrar).toHaveBeenCalledWith(expect.stringContaining(boa))
  })

  it('mantém a pasta padrão (primeira) quando ela funciona, sem avisar nada', () => {
    const padrao = join(base, 'padrao')
    const registrar = vi.fn()

    const atualizador = criarAtualizador([padrao, join(base, 'outra')], registrar, appFalso)

    expect((atualizador as unknown as Interno).app.baseCachePath).toBe(padrao)
    expect(registrar).not.toHaveBeenCalled()
  })

  it('traz um cliente HTTP, senão toda checagem falha com "Cannot read properties of null"', () => {
    const atualizador = criarAtualizador([join(base, 'padrao')], vi.fn(), appFalso)
    const { httpExecutor } = atualizador as unknown as Interno
    expect(httpExecutor).not.toBeNull()
    expect(typeof (httpExecutor as { request: unknown }).request).toBe('function')
  })

  it('guarda: o electron-updater instalado ainda deixa o cliente HTTP vazio com adaptador próprio', () => {
    // Se uma versão nova do pacote passar a preencher sozinho, este teste avisa que a atribuição manual
    // em criar-atualizador.ts pode ser removida (ou que algo mudou por baixo).
    const semAjuste = new NsisUpdater(undefined, new ElectronAppAdapter(appFalso))
    expect((semAjuste as unknown as Interno).httpExecutor).toBeNull()
  })
})
