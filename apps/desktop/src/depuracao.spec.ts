import { describe, expect, it } from 'vitest'
import { pedeDepuracao } from './depuracao'

describe('pedeDepuracao (R-SEG-14)', () => {
  it.each([
    ['--remote-debugging-port=9222'],
    ['--remote-debugging-port'],
    ['--remote-debugging-pipe'],
    ['--remote-allow-origins=*'],
    ['--inspect'],
    ['--inspect-brk=9229'],
  ])('reconhece %s', (opcao) => {
    expect(pedeDepuracao(['Brastem-Service.exe', opcao])).toBe(true)
  })

  it('não confunde com a abertura normal nem com as opções do atualizador', () => {
    expect(pedeDepuracao(['Brastem-Service.exe'])).toBe(false)
    expect(pedeDepuracao(['Brastem-Service.exe', '--updated', '--force-run'])).toBe(false)
    expect(pedeDepuracao(['Brastem-Service.exe', '--remote-debugging-portal'])).toBe(false)
  })
})
