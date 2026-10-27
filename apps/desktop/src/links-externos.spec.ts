import { describe, expect, it } from 'vitest'
import { podeAbrirFora } from './links-externos'

describe('podeAbrirFora (R-SEG-13)', () => {
  it('abre só o login do Google, em https', () => {
    expect(podeAbrirFora('https://accounts.google.com/o/oauth2/v2/auth?client_id=x')).toBe(true)
    expect(podeAbrirFora('http://accounts.google.com/')).toBe(false)
  })

  it('bloqueia qualquer outro endereço, inclusive disfarçado', () => {
    expect(podeAbrirFora('https://site-malicioso.com')).toBe(false)
    expect(podeAbrirFora('https://accounts.google.com.site-malicioso.com')).toBe(false)
    expect(podeAbrirFora('file:///C:/Windows/System32/calc.exe')).toBe(false)
    expect(podeAbrirFora('nao é url')).toBe(false)
  })
})
