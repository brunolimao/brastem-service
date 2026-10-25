export const ROLES = ['admin', 'usuario'] as const
export type Role = (typeof ROLES)[number]

export const STATUS_OS = ['ABERTO', 'AGUARDANDO', 'APROVADO', 'FECHADO', 'CANCELADO'] as const
export type StatusOS = (typeof STATUS_OS)[number]

export const TIPOS_PAGAMENTO = [
  'dinheiro',
  'debito',
  'credito',
  'pix',
  'parcelado',
  'cheque',
  'boleto',
  'transferencia',
] as const
export type TipoPagamento = (typeof TIPOS_PAGAMENTO)[number]

export const RECOMENDACOES = ['antigo', 'indicacao', 'internet', 'porta', 'outros'] as const
export type Recomendacao = (typeof RECOMENDACOES)[number]

export const TIPOS_TRANSACAO = ['receita', 'despesa'] as const
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number]

export const CATEGORIAS_RECEITA = ['venda', 'gorjeta', 'outros'] as const
export const CATEGORIAS_DESPESA = ['transporte', 'peca', 'loja', 'materiais', 'outros'] as const
