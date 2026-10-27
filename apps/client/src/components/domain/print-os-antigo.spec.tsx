import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { empresaVazia } from '@/models/empresa.model'
import type { UltimaOrdem } from '@/models/ordem-servico.model'
import { ordemDetalhe } from '@/test/dados'
import { PrintOSAntigo } from './print-os-antigo'

const detalhe = ordemDetalhe()

/** Texto do campo a partir do rótulo (rótulo e valor ficam no mesmo bloco, como no antigo). */
const campo = (rotulo: string) => screen.getAllByText(rotulo)[0]?.parentElement?.textContent

describe('PrintOSAntigo (R-IMP-03)', () => {
  it('é a folha do antigo: 2480 × 3508 px com fonte Inter, reduzida para a largura do A4 e sem margem', () => {
    const { container } = render(<PrintOSAntigo detalhe={detalhe} empresa={empresaVazia} />)
    const folha = screen.getByRole('article', { name: /modelo antigo/ })
    expect(folha.style.width).toBe('210mm')
    const pagina = folha.firstElementChild?.nextElementSibling as HTMLElement
    expect(pagina).toHaveStyle({ width: '2480px', height: '3508px', fontFamily: 'Inter' })
    expect(pagina.style.transform).toMatch(/^scale\(0\.320/)
    expect(container.querySelector('style')?.textContent).toContain('margin: 0')
  })

  it('traz os mesmos rótulos e valores do antigo, com o status como era gravado', () => {
    render(<PrintOSAntigo detalhe={detalhe} empresa={empresaVazia} />)
    expect(screen.getByText('Dados do cliente')).toBeInTheDocument()
    expect(screen.getByText('Dados da OS')).toBeInTheDocument()
    expect(campo('Código OS:')).toBe('Código OS: 42')
    expect(campo('Status:')).toBe('Status: FECHADO')
    expect(campo('Valor:')).toBe('Valor: 300,00')
    expect(campo('Taxa de serviço:')).toBe('Taxa de serviço: 50,00')
    expect(campo('Data de abertura:')).toBe('Data de abertura: 30/09/2026')
    expect(campo('CPF/CNPJ:')).toBe('CPF/CNPJ: 123.456.789-01')
    expect(campo('Telefone:')).toBe('Telefone: (31) 99999-1111')
    expect(campo('Problema relatado:')).toBe('Problema relatado: Não gela')
    expect(screen.getByText('Brastem-Service')).toBeInTheDocument()
  })

  it('lista as 5 OS mais novas do aparelho, contando a que está sendo impressa', () => {
    const [atual, anterior] = detalhe.ultimasOrdens as [UltimaOrdem, UltimaOrdem]
    const ultimasOrdens = [42, 36, 33, 31, 30, 20].map((id) =>
      id === 42 ? atual : { ...anterior, id },
    )
    render(<PrintOSAntigo detalhe={{ ...detalhe, ultimasOrdens }} empresa={empresaVazia} />)
    const linhas = screen.getAllByTestId('ultimo-servico')
    expect(linhas.map((linha) => linha.firstChild?.textContent)).toEqual([
      '42',
      '36',
      '33',
      '31',
      '30',
    ])
    expect(linhas[0]?.textContent).toContain('Troca do compressor')
    expect(linhas[0]?.textContent).toContain('90')
  })

  it('o cabeçalho vem de Configurações e mostra só o que foi preenchido (R-IMP-01)', () => {
    render(
      <PrintOSAntigo
        detalhe={detalhe}
        empresa={{
          nome: 'Assistência Exemplo',
          cnpj: '12.345.678/0001-99',
          telefone: '',
          endereco: 'Rua Exemplo, 100',
          cep: '01000-000',
        }}
      />,
    )
    expect(screen.getByText('Assistência Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Rua Exemplo, 100')).toBeInTheDocument()
    expect(screen.getByText('CEP: 01000-000')).toBeInTheDocument()
    expect(screen.getByText('CNPJ: 12.345.678/0001-99')).toBeInTheDocument()
    expect(screen.queryByText(/Fone:/)).toBeNull()
  })
})
