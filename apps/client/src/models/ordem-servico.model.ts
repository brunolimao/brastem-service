import { STATUS_OS, type StatusOS } from '@brastem/shared'
import { z } from 'zod'
import { centavosParaReais, hojeIso, reaisParaCentavos } from '@/libs/formatters'
import type { AparelhoApi, ClienteApi, TelefoneApi } from './cliente.model'
import {
  dinheiroTexto,
  formParaPagamentos,
  type PagamentoApi,
  type PagamentoForm,
  pagamentoFormSchema,
  pagamentoParaForm,
} from './pagamento.model'

export const ROTULO_STATUS: Record<StatusOS, string> = {
  ABERTO: 'Aberto',
  AGUARDANDO: 'Aguardando',
  APROVADO: 'Aprovado',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

export const OPCOES_STATUS = STATUS_OS.map((valor) => ({ valor, rotulo: ROTULO_STATUS[valor] }))

/** Cor do tema de cada status nos gráficos (Início, Relatórios). */
export const COR_DO_STATUS: Record<StatusOS, string> = {
  ABERTO: '--chart-1',
  AGUARDANDO: '--chart-4',
  APROVADO: '--chart-5',
  FECHADO: '--chart-3',
  CANCELADO: '--chart-2',
}

export const CAMPOS_BUSCA_OS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'id', rotulo: 'Código' },
  { valor: 'abertura', rotulo: 'Data de abertura' },
  { valor: 'valor', rotulo: 'Valor' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'solucionado', rotulo: 'Problema solucionado' },
] as const

export interface OrdemServicoListada {
  id: number
  abertura: string
  fechamento: string | null
  valor: number
  taxaDeslocamento: number
  status: StatusOS
  solucionado: string
  clienteId: number
  clienteNome: string
  clienteNegativado: boolean
  aparelhoId: number
  aparelhoNome: string
}

export interface OrdemServicoApi {
  id: number
  clienteId: number
  aparelhoId: number
  status: StatusOS
  valor: number
  taxaDeslocamento: number
  relatado: string
  identificado: string
  solucionado: string
  observacao: string
  garantiaDias: number | null
  isGarantia: boolean
  abertura: string
  fechamento: string | null
  criadoEm: string
}

export interface UltimaOrdem {
  id: number
  abertura: string
  fechamento: string | null
  valor: number
  taxaDeslocamento: number
  solucionado: string
  garantiaDias: number | null
}

export interface OrdemServicoDetalhe {
  ordemServico: OrdemServicoApi
  cliente: ClienteApi
  aparelho: AparelhoApi
  telefones: TelefoneApi[]
  pagamentos: PagamentoApi[]
  ultimasOrdens: UltimaOrdem[]
}

export const ordemServicoFormSchema = z
  .object({
    status: z.enum(STATUS_OS),
    valor: dinheiroTexto,
    taxaDeslocamento: dinheiroTexto,
    relatado: z.string(),
    identificado: z.string(),
    solucionado: z.string(),
    observacao: z.string(),
    garantiaDias: z.string().regex(/^\d*$/, 'Use só números'),
    isGarantia: z.boolean(),
    abertura: z.string().min(1, 'Informe a data de abertura'),
    fechamento: z.string(),
    pagamentos: z.array(pagamentoFormSchema),
  })
  .superRefine((dados, contexto) => {
    if (dados.status === 'FECHADO' && !dados.fechamento) {
      contexto.addIssue({
        code: 'custom',
        path: ['fechamento'],
        message: 'Informe a data de fechamento',
      })
    }
  })
export type OrdemServicoForm = z.infer<typeof ordemServicoFormSchema>

export const ordemServicoVazia = (): OrdemServicoForm => ({
  status: 'ABERTO',
  valor: '',
  taxaDeslocamento: '',
  relatado: '',
  identificado: '',
  solucionado: '',
  observacao: '',
  garantiaDias: '',
  isGarantia: false,
  abertura: hojeIso(),
  fechamento: '',
  pagamentos: [],
})

export const ordemServicoParaForm = (detalhe: OrdemServicoDetalhe): OrdemServicoForm => {
  const os = detalhe.ordemServico
  return {
    status: os.status,
    valor: os.valor ? centavosParaReais(os.valor) : '',
    taxaDeslocamento: os.taxaDeslocamento ? centavosParaReais(os.taxaDeslocamento) : '',
    relatado: os.relatado,
    identificado: os.identificado,
    solucionado: os.solucionado,
    observacao: os.observacao,
    garantiaDias: os.garantiaDias ? String(os.garantiaDias) : '',
    isGarantia: os.isGarantia,
    abertura: os.abertura,
    fechamento: os.fechamento ?? '',
    pagamentos: detalhe.pagamentos.map(pagamentoParaForm),
  }
}

/** Corpo enviado à API (dinheiro em centavos; datas e garantia vazias vão como null). */
export function formParaPayloadOrdemServico(form: OrdemServicoForm) {
  return {
    status: form.status,
    valor: reaisParaCentavos(form.valor),
    taxaDeslocamento: reaisParaCentavos(form.taxaDeslocamento),
    relatado: form.relatado,
    identificado: form.identificado,
    solucionado: form.solucionado,
    observacao: form.observacao,
    // Vazio vai como null: o server limpa o campo (undefined seria "não mexer").
    garantiaDias: form.garantiaDias ? Number(form.garantiaDias) : null,
    isGarantia: form.isGarantia,
    abertura: form.abertura,
    fechamento: form.fechamento || null,
    pagamentos: formParaPagamentos(form.pagamentos as PagamentoForm[]),
  }
}

/** A seção de pagamentos aparece quando a OS está fechada, tem taxa de deslocamento ou já tem pagamentos. */
export const mostrarPagamentos = (
  form: Pick<OrdemServicoForm, 'status' | 'taxaDeslocamento' | 'pagamentos'>,
) =>
  form.status === 'FECHADO' ||
  reaisParaCentavos(form.taxaDeslocamento) > 0 ||
  form.pagamentos.length > 0

/** Colunas da lista que o servidor sabe ordenar (as mesmas chaves das colunas da tabela). */
export const ORDENAVEIS_OS = [
  'id',
  'abertura',
  'valor',
  'status',
  'solucionado',
  'clienteNome',
  'aparelhoNome',
] as const
