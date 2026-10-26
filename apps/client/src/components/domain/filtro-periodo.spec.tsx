import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FiltroPeriodo } from './filtro-periodo'

const OUTUBRO = { inicio: '2026-10-01', fim: '2026-10-31' }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 10, 0))
})
afterEach(() => vi.useRealTimers())

const de = () => screen.getByLabelText('De') as HTMLInputElement
const ate = () => screen.getByLabelText('Até') as HTMLInputElement

describe('FiltroPeriodo', () => {
  it('pesquisa o período digitado, com as duas datas incluídas', () => {
    const aoMudar = vi.fn()
    render(<FiltroPeriodo periodo={OUTUBRO} aoMudar={aoMudar} />)

    fireEvent.change(de(), { target: { value: '2026-09-10' } })
    fireEvent.change(ate(), { target: { value: '2026-09-20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }))

    expect(aoMudar).toHaveBeenCalledExactlyOnceWith({ inicio: '2026-09-10', fim: '2026-09-20' })
  })

  it('não deixa pesquisar com o início depois do fim ou com data vazia', () => {
    render(<FiltroPeriodo periodo={OUTUBRO} aoMudar={vi.fn()} />)
    const pesquisar = screen.getByRole('button', { name: 'Pesquisar' })

    fireEvent.change(de(), { target: { value: '2026-11-01' } })
    expect(pesquisar).toBeDisabled()

    fireEvent.change(de(), { target: { value: '' } })
    expect(pesquisar).toBeDisabled()
  })

  it.each([
    ['Hoje', { inicio: '2026-10-15', fim: '2026-10-15' }],
    ['Mês', { inicio: '2026-10-01', fim: '2026-10-31' }],
    ['Ano', { inicio: '2026-01-01', fim: '2026-12-31' }],
  ])('atalho "%s" aplica o período e preenche as datas', (atalho, esperado) => {
    const aoMudar = vi.fn()
    render(
      <FiltroPeriodo periodo={{ inicio: '2025-01-01', fim: '2025-01-31' }} aoMudar={aoMudar} />,
    )

    fireEvent.click(screen.getByRole('button', { name: atalho }))

    expect(aoMudar).toHaveBeenCalledExactlyOnceWith(esperado)
    expect([de().value, ate().value]).toEqual([esperado.inicio, esperado.fim])
  })
})
