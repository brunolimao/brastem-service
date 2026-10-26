import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const icone = join(__dirname, '..', 'recursos', 'icon.png')

describe('ícone do app', () => {
  it('existe e não é ignorado pelo git (senão o instalador do CI sai com o ícone do Electron)', () => {
    expect(existsSync(icone)).toBe(true)
    // `git check-ignore -q` sai com 0 se o arquivo é ignorado e com 1 se não é.
    const ignorado = (() => {
      try {
        execFileSync('git', ['check-ignore', '-q', icone], { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    })()
    expect(ignorado).toBe(false)
  })
})
