import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { AparenciaCard } from './aparencia-card'

beforeEach(() => {
  usePreferenciasStore.setState({ tamanhoDeLetra: 1 })
  document.documentElement.style.fontSize = ''
})

describe('AparenciaCard: tamanho da letra (R-UX-05)', () => {
  it('muda o tamanho de todo o sistema e marca a opção escolhida', () => {
    render(<AparenciaCard />)
    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Bem maior' }))
    expect(document.documentElement.style.fontSize).toBe('125%')
    expect(screen.getByRole('button', { name: 'Bem maior' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Menor' }))
    expect(document.documentElement.style.fontSize).toBe('87.5%')
    expect(usePreferenciasStore.getState().tamanhoDeLetra).toBe(0)
  })

  it('nunca sai da lista de tamanhos (preferência antiga ou inválida)', () => {
    act(() => usePreferenciasStore.getState().definirTamanhoDeLetra(9))
    expect(usePreferenciasStore.getState().tamanhoDeLetra).toBe(3)
    act(() => usePreferenciasStore.getState().definirTamanhoDeLetra(-2))
    expect(usePreferenciasStore.getState().tamanhoDeLetra).toBe(0)
  })
})

describe('AparenciaCard: cores (R-UX-19)', () => {
  beforeEach(() => useThemeStore.setState({ tema: 'claro', paleta: 'azul-tomate' }))

  it('mostra as 8 paletas, marca a atual e troca as cores na hora', () => {
    render(<AparenciaCard />)
    const cores = screen.getByRole('group', { name: 'Cores' })
    expect(cores.querySelectorAll('button')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'Azul e tomate' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Petróleo e âmbar' }))
    expect(useThemeStore.getState().paleta).toBe('petroleo-ambar')
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#0e6b73')
    expect(screen.getByRole('button', { name: 'Petróleo e âmbar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Azul e tomate' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('no tema escuro, a paleta usa a versão escura', () => {
    act(() => useThemeStore.getState().definirTema('escuro'))
    act(() => useThemeStore.getState().definirPaleta('violeta-pessego'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#a994f5')
    act(() => useThemeStore.getState().definirTema('claro'))
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#5b3fd1')
  })
})
