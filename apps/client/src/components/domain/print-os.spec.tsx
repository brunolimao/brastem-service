import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { empresaVazia } from '@/models/empresa.model'
import type { UltimaOrdem } from '@/models/ordem-servico.model'
import { ordemDetalhe } from '@/test/dados'
import { PrintOS } from './print-os'

// A mesma OS de exemplo das telas (dados inventados).
const detalhe = ordemDetalhe()

describe('PrintOS', () => {
  it('mostra o número da OS, o cliente formatado e os serviços anteriores sem repetir a atual', () => {
    render(<PrintOS detalhe={detalhe} empresa={empresaVazia} />)

    expect(screen.getByText('Nº 42')).toBeInTheDocument()
    expect(screen.getByText('João da Silva', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('123.456.789-01', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('(31) 99999-1111', { exact: false })).toBeInTheDocument()

    const anteriores = screen.getByRole('heading', { name: /últimos serviços/i }).closest('section')
    expect(anteriores).not.toBeNull()
    expect(within(anteriores as HTMLElement).getByText('Troca do termostato')).toBeInTheDocument()
    expect(within(anteriores as HTMLElement).queryByText('42')).not.toBeInTheDocument()
  })

  it('mostra até 5 serviços anteriores além da OS atual, do mais novo para o mais antigo (R-IMP-02)', () => {
    const [atual, anterior] = detalhe.ultimasOrdens as [UltimaOrdem, UltimaOrdem]
    // A atual no meio da lista (OS antiga reimpressa) e 6 outras: saem só as 5 mais novas.
    const ultimasOrdens = [50, 48, 42, 36, 33, 31, 30].map((id) =>
      id === 42 ? atual : { ...anterior, id, solucionado: `Serviço ${id}` },
    )
    render(<PrintOS detalhe={{ ...detalhe, ultimasOrdens }} empresa={empresaVazia} />)
    const anteriores = screen.getByRole('heading', { name: /últimos serviços/i }).closest('section')
    const linhas = within(anteriores as HTMLElement)
      .getAllByRole('row')
      .slice(1)
    expect(linhas.map((linha) => linha.firstChild?.textContent)).toEqual([
      '50',
      '48',
      '36',
      '33',
      '31',
    ])
  })

  it('mostra o código do aparelho e até quando vai a garantia dele (como a impressão antiga)', () => {
    render(
      <PrintOS
        detalhe={{
          ...detalhe,
          aparelho: { ...detalhe.aparelho, ordem: 2, garantiaAte: '2026-12-30' },
        }}
        empresa={empresaVazia}
      />,
    )
    const aparelho = screen.getByRole('heading', { name: 'Aparelho' }).closest('section')
    expect(
      within(aparelho as HTMLElement).getByText(/Código do aparelho/).parentElement?.textContent,
    ).toBe('Código do aparelho: 2')
    expect(within(aparelho as HTMLElement).getByText(/30\/12\/2026/)).toBeInTheDocument()
  })

  it('formata os pagamentos em reais e parcelas', () => {
    render(<PrintOS detalhe={detalhe} empresa={empresaVazia} />)
    const pagamentos = screen.getByRole('heading', { name: 'Pagamentos' }).closest('section')
    expect(within(pagamentos as HTMLElement).getByText('3x')).toBeInTheDocument()
    expect(within(pagamentos as HTMLElement).getByText(/350,00/)).toBeInTheDocument()
  })

  it('sem dados da empresa mostra só o nome do sistema, sem CNPJ, telefone nem endereço', () => {
    render(<PrintOS detalhe={detalhe} empresa={empresaVazia} />)
    expect(screen.getByText('Brastem-Service')).toBeInTheDocument()
    expect(screen.queryByText(/^CNPJ \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Fone /)).not.toBeInTheDocument()
  })

  it('mostra no cabeçalho só o que a empresa preencheu', () => {
    render(
      <PrintOS
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
    expect(screen.getByText('CEP 01000-000')).toBeInTheDocument()
    expect(screen.getByText('CNPJ 12.345.678/0001-99')).toBeInTheDocument()
    expect(screen.queryByText(/^Fone /)).not.toBeInTheDocument()
  })

  it('omite as seções sem conteúdo', () => {
    render(
      <PrintOS
        detalhe={{ ...detalhe, pagamentos: [], ultimasOrdens: [] }}
        empresa={empresaVazia}
      />,
    )
    expect(screen.queryByRole('heading', { name: 'Pagamentos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /últimos serviços/i })).not.toBeInTheDocument()
  })
})
