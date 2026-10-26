// Dados inventados para os testes (o repositório é público: nada de cliente ou loja de verdade).
import { TIPOS_PAGAMENTO } from '@brastem/shared'
import type { Caixa, ItemCaixa } from '@/models/caixa.model'
import type { ClienteDetalhe, ClienteListado } from '@/models/cliente.model'
import type { OrdemServicoDetalhe, OrdemServicoListada } from '@/models/ordem-servico.model'
import type { PagamentoListado } from '@/models/pagamento.model'
import type { Pagina } from '@/models/pagina.model'
import type { Relatorio } from '@/models/relatorio.model'
import type { Usuario } from '@/models/usuario.model'

export const pagina = <T>(
  items: T[],
  total = items.length,
  page = 1,
  pageSize = 20,
): Pagina<T> => ({
  items,
  total,
  page,
  pageSize,
})

export const clienteListado = (dados: Partial<ClienteListado> = {}): ClienteListado => ({
  id: 7,
  nome: 'João da Silva',
  email: 'joao@exemplo.com',
  cpf: '12345678901',
  negativado: false,
  ...dados,
})

export const clienteDetalhe = (dados: Partial<ClienteDetalhe> = {}): ClienteDetalhe => ({
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
  telefones: [{ id: 1, clienteId: 7, nome: 'Casa', telefone: '31999991111' }],
  aparelhos: [
    {
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
  ],
  ...dados,
})

export const ordemDetalhe = (): OrdemServicoDetalhe => {
  const { telefones, aparelhos, ...cliente } = clienteDetalhe()
  return {
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
    cliente,
    aparelho: aparelhos[0] as ClienteDetalhe['aparelhos'][number],
    telefones,
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
}

export const ordemListada = (dados: Partial<OrdemServicoListada> = {}): OrdemServicoListada => ({
  id: 42,
  abertura: '2026-09-30',
  fechamento: '2026-10-01',
  valor: 30000,
  taxaDeslocamento: 5000,
  status: 'FECHADO',
  solucionado: 'Troca do compressor',
  clienteId: 7,
  clienteNome: 'João da Silva',
  clienteNegativado: false,
  aparelhoId: 3,
  aparelhoNome: 'Geladeira',
  ...dados,
})

export const itemCaixa = (dados: Partial<ItemCaixa> = {}): ItemCaixa => ({
  id: 1,
  valor: 35000,
  data: '2026-10-01',
  numero: 1,
  totalParcelas: 1,
  tipo: 'pix',
  observacao: '',
  pagamentoId: 1,
  ordemServicoId: 42,
  clienteId: 7,
  aparelhoId: 3,
  transacaoId: null,
  categoria: null,
  descricao: null,
  ...dados,
})

export const caixa = (itens: ItemCaixa[], dados: Partial<Caixa> = {}): Caixa => ({
  periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
  total: itens.reduce((soma, item) => soma + item.valor, 0),
  formas: Object.fromEntries(
    TIPOS_PAGAMENTO.map((tipo) => [tipo, itens.filter((item) => item.tipo === tipo).length]),
  ) as Caixa['formas'],
  itens,
  quantidade: itens.length,
  page: 1,
  pageSize: 20,
  ...dados,
})

export const pagamentoListado = (dados: Partial<PagamentoListado> = {}): PagamentoListado => ({
  id: 1,
  tipo: 'credito',
  parcelas: 3,
  data: '2026-10-01',
  valor: 35000,
  observacao: '',
  ordemServicoId: 42,
  transacaoId: null,
  clienteId: 7,
  aparelhoId: 3,
  ...dados,
})

export const relatorio = (): Relatorio => ({
  periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
  kpis: {
    valorTotal: 200000,
    valorFechado: 150000,
    ordensEmGarantia: 2,
    totalOrdens: 8,
    novosClientes: 5,
  },
  status: { ABERTO: 2, AGUARDANDO: 1, APROVADO: 0, FECHADO: 4, CANCELADO: 1 },
  recomendacaoOrdens: { antigo: 3, indicacao: 2, internet: 2, porta: 1, outros: 0 },
  recomendacaoClientes: { antigo: 0, indicacao: 2, internet: 2, porta: 1, outros: 0 },
  cidades: [{ name: 'Belo Horizonte', value: 5 }],
  bairros: [{ name: 'Centro', value: 5 }],
})

export const usuario = (dados: Partial<Usuario> = {}): Usuario => ({
  id: 1,
  usuario: 'ana',
  role: 'admin',
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
  ...dados,
})
