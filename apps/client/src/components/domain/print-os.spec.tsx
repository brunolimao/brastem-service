import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OrdemServicoDetalhe } from '@/models/ordem-servico.model'
import { PrintOS } from './print-os'

const detalhe: OrdemServicoDetalhe = {
  ordemServico: {
    id: 42,
    clienteId: 7,
    aparelhoId: 3,
    status: 'FECHADO',
    valor: 30000,
    taxaDeslocamento: 5000,
    relatado: 'Não gela',
    identificado: 'Compressor queimado',
    solucionado: 'Troca do compressor',
    observacao: '',
    garantiaDias: 90,
    isGarantia: false,
    abertura: '2026-09-30',
    fechamento: '2026-10-01',
    criadoEm: '2026-09-30T10:00:00.000Z',
  },
  cliente: {
    id: 7,
    nome: 'João da Silva',
    cpf: '12345678901',
    email: '',
    endereco: 'Rua A',
    numero: '10',
    complemento: '',
    bairro: 'Centro',
    cep: '31910-520',
    uf: 'MG',
    cidade: 'Belo Horizonte',
    negativado: false,
    motivo: '',
    recomendacao: 'internet',
    referencia: '',
    criadoEm: '2026-09-01T10:00:00.000Z',
  },
  aparelho: {
    id: 3,
    clienteId: 7,
    ordem: 1,
    nome: 'Geladeira',
    marca: 'Brastemp',
    modelo: 'Frost Free',
    pnc: '123',
    garantiaAte: null,
    observacao: '',
  },
  telefones: [{ id: 1, clienteId: 7, nome: 'Casa', telefone: '31999991111' }],
  pagamentos: [
    { id: 1, tipo: 'credito', parcelas: 3, data: '2026-10-01', valor: 35000, observacao: '' },
  ],
  ultimasOrdens: [
    {
      id: 42,
      abertura: '2026-09-30',
      fechamento: '2026-10-01',
      valor: 30000,
      taxaDeslocamento: 5000,
      solucionado: 'Troca do compressor',
      garantiaDias: 90,
    },
    {
      id: 30,
      abertura: '2025-01-10',
      fechamento: '2025-01-11',
      valor: 12000,
      taxaDeslocamento: 0,
      solucionado: 'Troca do termostato',
      garantiaDias: null,
    },
  ],
}

describe('PrintOS', () => {
  it('mostra o número da OS, o cliente formatado e os serviços anteriores sem repetir a atual', () => {
    render(<PrintOS detalhe={detalhe} />)

    expect(screen.getByText('Nº 42')).toBeInTheDocument()
    expect(screen.getByText('João da Silva', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('123.456.789-01', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('(31) 99999-1111', { exact: false })).toBeInTheDocument()

    const anteriores = screen.getByRole('heading', { name: /últimos serviços/i }).closest('section')
    expect(anteriores).not.toBeNull()
    expect(within(anteriores as HTMLElement).getByText('Troca do termostato')).toBeInTheDocument()
    expect(within(anteriores as HTMLElement).queryByText('42')).not.toBeInTheDocument()
  })

  it('formata os pagamentos em reais e parcelas', () => {
    render(<PrintOS detalhe={detalhe} />)
    const pagamentos = screen.getByRole('heading', { name: 'Pagamentos' }).closest('section')
    expect(within(pagamentos as HTMLElement).getByText('3x')).toBeInTheDocument()
    expect(within(pagamentos as HTMLElement).getByText(/350,00/)).toBeInTheDocument()
  })

  it('omite as seções sem conteúdo', () => {
    render(<PrintOS detalhe={{ ...detalhe, pagamentos: [], ultimasOrdens: [] }} />)
    expect(screen.queryByRole('heading', { name: 'Pagamentos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /últimos serviços/i })).not.toBeInTheDocument()
  })
})
