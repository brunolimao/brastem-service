import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAppForm } from './form-hook'

function Formulario() {
  const form = useAppForm({ defaultValues: { valor: '' } })
  return (
    <form.AppField name="valor">{(campo) => <campo.CampoDinheiro rotulo="Valor" />}</form.AppField>
  )
}

const valor = () => screen.getByLabelText('Valor') as HTMLInputElement

const digitarESair = (texto: string) => {
  fireEvent.change(valor(), { target: { value: texto } })
  fireEvent.blur(valor())
}

describe('CampoDinheiro (R-DAD-01)', () => {
  it.each([
    ['1.250', '1.250,00'],
    ['1250,5', '1.250,50'],
    ['1.250.000', '1.250.000,00'],
    ['0,99', '0,99'],
  ])('ao sair do campo, "%s" vira "%s" (ponto é milhar)', (digitado, esperado) => {
    render(<Formulario />)
    digitarESair(digitado)
    expect(valor().value).toBe(esperado)
  })

  it('ignora o que não é número, vírgula ou ponto (ex.: "R$")', () => {
    render(<Formulario />)
    fireEvent.change(valor(), { target: { value: 'R$ 12a' } })
    expect(valor().value).toBe('12')
  })

  it('vazio continua vazio ao sair', () => {
    render(<Formulario />)
    digitarESair('')
    expect(valor().value).toBe('')
  })
})
