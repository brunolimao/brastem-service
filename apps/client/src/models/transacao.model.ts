import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, type TipoTransacao } from '@brastem/shared'
import { z } from 'zod'
import { formatarMoeda, hojeIso, reaisParaCentavos } from '@/libs/formatters'
import { dinheiroTexto, formParaPagamentos, pagamentoFormSchema } from './pagamento.model'

export const ROTULO_CATEGORIA: Record<string, string> = {
  venda: 'Venda',
  gorjeta: 'Gorjeta',
  transporte: 'Transporte',
  peca: 'Peça',
  loja: 'Loja',
  materiais: 'Materiais',
  outros: 'Outros',
}

export const CATEGORIAS: Record<TipoTransacao, readonly string[]> = {
  receita: CATEGORIAS_RECEITA,
  despesa: CATEGORIAS_DESPESA,
}

export const opcoesCategoria = (tipo: TipoTransacao) =>
  CATEGORIAS[tipo].map((valor) => ({ valor, rotulo: ROTULO_CATEGORIA[valor] ?? valor }))

export const transacaoFormSchema = z
  .object({
    descricao: z.string().min(1, 'Informe a descrição'),
    valor: dinheiroTexto.refine((valor) => reaisParaCentavos(valor) > 0, 'Informe o valor'),
    categoria: z.string().min(1, 'Escolha a categoria'),
    data: z.string().min(1, 'Informe a data'),
    observacao: z.string(),
    pagamentos: z.array(pagamentoFormSchema),
  })
  .superRefine((form, ctx) => {
    // Sem pagamentos o server lança tudo em dinheiro; com eles, a soma precisa fechar com o valor.
    const pagamentos = formParaPagamentos(form.pagamentos)
    if (pagamentos.length === 0) return
    const soma = pagamentos.reduce((total, pagamento) => total + pagamento.valor, 0)
    if (soma !== reaisParaCentavos(form.valor)) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor'],
        message: `A soma dos pagamentos (${formatarMoeda(soma)}) é diferente do valor`,
      })
    }
  })
export type TransacaoForm = z.infer<typeof transacaoFormSchema>

export const transacaoVazia = (tipo: TipoTransacao): TransacaoForm => ({
  descricao: '',
  valor: '',
  categoria: CATEGORIAS[tipo][0] ?? 'outros',
  data: hojeIso(),
  observacao: '',
  pagamentos: [],
})

export const formParaPayloadTransacao = (tipo: TipoTransacao, form: TransacaoForm) => ({
  tipo,
  categoria: form.categoria,
  data: form.data,
  descricao: form.descricao,
  observacao: form.observacao,
  valor: reaisParaCentavos(form.valor),
  pagamentos: form.pagamentos.length > 0 ? formParaPagamentos(form.pagamentos) : undefined,
})
