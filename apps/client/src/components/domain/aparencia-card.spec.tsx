import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
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
