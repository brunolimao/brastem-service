import { TIPOS_PAGAMENTO, type TipoPagamento } from '@brastem/shared'
import { z } from 'zod'
import { centavosParaReais, hojeIso, reaisParaCentavos } from '@/libs/formatters'

export const ROTULO_TIPO_PAGAMENTO: Record<TipoPagamento, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
  pix: 'Pix',
  parcelado: 'Pix parcelado',
  cheque: 'Cheque',
  boleto: 'Boleto',
  transferencia: 'Transferência',
}

export const OPCOES_TIPO_PAGAMENTO = TIPOS_PAGAMENTO.map((tipo) => ({
  valor: tipo,
  rotulo: ROTULO_TIPO_PAGAMENTO[tipo],
}))

export const OPCOES_PARCELAS = Array.from({ length: 13 }, (_, n) => ({
  valor: String(n),
  rotulo: n === 0 ? 'À vista' : `${n}x`,
}))

/** Texto de dinheiro digitado: "150", "150,5", "1.250,75". Vazio é aceito (vira 0). */
export const dinheiroTexto = z
  .string()
  .refine(
    (valor) => valor === '' || /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(valor),
    {
      message: 'Valor inválido',
    },
  )

export const pagamentoFormSchema = z.object({
  chave: z.string(),
  valor: dinheiroTexto,
  tipo: z.enum(TIPOS_PAGAMENTO),
  parcelas: z.string(),
  data: z.string().min(1, 'Informe a data'),
  observacao: z.string(),
})
export type PagamentoForm = z.infer<typeof pagamentoFormSchema>

export const pagamentoVazio = (): PagamentoForm => ({
  chave: crypto.randomUUID(),
  valor: '',
  tipo: 'dinheiro',
  parcelas: '0',
  data: hojeIso(),
  observacao: '',
})

export interface ParcelaApi {
  id: number
  pagamentoId: number
  numero: number
  data: string
  valor: number
}

export interface PagamentoApi {
  id: number
  tipo: TipoPagamento
  parcelas: number
  data: string
  valor: number
  observacao: string
  parcelasLista?: ParcelaApi[]
}

export const pagamentoParaForm = (pagamento: PagamentoApi): PagamentoForm => ({
  chave: crypto.randomUUID(),
  valor: centavosParaReais(pagamento.valor),
  tipo: pagamento.tipo,
  parcelas: String(pagamento.parcelas),
  data: pagamento.data,
  observacao: pagamento.observacao,
})

/** Pagamentos sem valor são descartados, como no sistema antigo. */
export const formParaPagamentos = (pagamentos: PagamentoForm[]) =>
  pagamentos
    .filter((pagamento) => reaisParaCentavos(pagamento.valor) > 0)
    .map((pagamento) => ({
      valor: reaisParaCentavos(pagamento.valor),
      tipo: pagamento.tipo,
      parcelas: Number(pagamento.parcelas),
      data: pagamento.data,
      observacao: pagamento.observacao,
    }))

export interface PagamentoListado {
  id: number
  tipo: TipoPagamento
  parcelas: number
  data: string
  valor: number
  observacao: string
  ordemServicoId: number | null
  transacaoId: number | null
  clienteId: number | null
  aparelhoId: number | null
}
