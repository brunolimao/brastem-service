import { RECOMENDACOES, type Recomendacao } from '@brastem/shared'
import { format, parseISO } from 'date-fns'
import { z } from 'zod'

export const ROTULO_RECOMENDACAO: Record<Recomendacao, string> = {
  antigo: 'Cliente antigo',
  indicacao: 'Indicação',
  internet: 'Internet',
  porta: 'Porta',
  outros: 'Outros',
}

export const OPCOES_RECOMENDACAO = RECOMENDACOES.map((valor) => ({
  valor,
  rotulo: ROTULO_RECOMENDACAO[valor],
}))

export const CAMPOS_BUSCA_CLIENTE = [
  { valor: 'todos', rotulo: 'Todos os campos' },
  { valor: 'id', rotulo: 'Código' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'cpf', rotulo: 'CPF/CNPJ' },
  { valor: 'endereco', rotulo: 'Endereço' },
  { valor: 'cep', rotulo: 'CEP' },
  { valor: 'telefone', rotulo: 'Telefone' },
] as const

export interface ClienteListado {
  id: number
  nome: string
  email: string
  cpf: string
  negativado: boolean
}

export interface TelefoneApi {
  id: number
  clienteId: number
  nome: string
  telefone: string
}

export interface AparelhoApi {
  id: number
  clienteId: number
  ordem: number
  nome: string
  marca: string
  modelo: string
  pnc: string
  garantiaAte: string | null
  observacao: string
}

export interface ClienteApi {
  id: number
  nome: string
  cpf: string
  email: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  uf: string
  cidade: string
  negativado: boolean
  motivo: string
  recomendacao: Recomendacao
  referencia: string
  criadoEm: string
}

export interface ClienteDetalhe extends ClienteApi {
  telefones: TelefoneApi[]
  aparelhos: AparelhoApi[]
}

export const telefoneFormSchema = z.object({
  chave: z.string(),
  id: z.number().optional(),
  nome: z.string(),
  telefone: z.string().min(1, 'Informe o telefone'),
})

export const aparelhoFormSchema = z.object({
  chave: z.string(),
  id: z.number().optional(),
  nome: z.string().min(1, 'Informe o aparelho'),
  marca: z.string(),
  modelo: z.string(),
  pnc: z.string(),
  observacao: z.string(),
  garantiaAte: z.string().nullable(),
})

export const clienteFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  cpf: z.string(),
  email: z.union([z.literal(''), z.email('E-mail inválido')]),
  cep: z.string(),
  endereco: z.string(),
  numero: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string().max(2, 'Use a sigla com 2 letras'),
  recomendacao: z.enum(RECOMENDACOES),
  negativado: z.boolean(),
  motivo: z.string(),
  referencia: z.string(),
  /** Só na edição (yyyy-MM-dd); no cadastro fica vazio e o server usa a data de hoje. */
  dataCadastro: z.string(),
  telefones: z.array(telefoneFormSchema),
  aparelhos: z.array(aparelhoFormSchema),
})
export type ClienteForm = z.infer<typeof clienteFormSchema>
export type TelefoneForm = z.infer<typeof telefoneFormSchema>
export type AparelhoForm = z.infer<typeof aparelhoFormSchema>

export const telefoneVazio = (): TelefoneForm => ({
  chave: crypto.randomUUID(),
  nome: '',
  telefone: '',
})

export const aparelhoVazio = (): AparelhoForm => ({
  chave: crypto.randomUUID(),
  nome: '',
  marca: '',
  modelo: '',
  pnc: '',
  observacao: '',
  garantiaAte: null,
})

export const clienteVazio = (): ClienteForm => ({
  nome: '',
  cpf: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  recomendacao: 'antigo',
  negativado: false,
  motivo: '',
  referencia: '',
  dataCadastro: '',
  telefones: [telefoneVazio()],
  aparelhos: [aparelhoVazio()],
})

export const clienteParaForm = (cliente: ClienteDetalhe): ClienteForm => ({
  nome: cliente.nome,
  cpf: cliente.cpf,
  email: cliente.email,
  cep: cliente.cep,
  endereco: cliente.endereco,
  numero: cliente.numero,
  complemento: cliente.complemento,
  bairro: cliente.bairro,
  cidade: cliente.cidade,
  uf: cliente.uf,
  recomendacao: cliente.recomendacao,
  negativado: cliente.negativado,
  motivo: cliente.motivo,
  referencia: cliente.referencia,
  // criadoEm é UTC: a data mostrada é a do relógio local (a mesma do relatório).
  dataCadastro: format(parseISO(cliente.criadoEm), 'yyyy-MM-dd'),
  telefones: cliente.telefones.map((t) => ({
    chave: crypto.randomUUID(),
    id: t.id,
    nome: t.nome,
    telefone: t.telefone,
  })),
  aparelhos: cliente.aparelhos.map((a) => ({
    chave: crypto.randomUUID(),
    id: a.id,
    nome: a.nome,
    marca: a.marca,
    modelo: a.modelo,
    pnc: a.pnc,
    observacao: a.observacao,
    garantiaAte: a.garantiaAte,
  })),
})

/** Corpo enviado à API: tira a chave de tela, o motivo (se não negativado) e a garantia (calculada no servidor). */
export function formParaPayloadCliente(form: ClienteForm) {
  return {
    ...form,
    motivo: form.negativado ? form.motivo : '',
    dataCadastro: form.dataCadastro || undefined,
    telefones: form.telefones.map(({ chave: _chave, ...telefone }) => telefone),
    aparelhos: form.aparelhos.map(
      ({ chave: _chave, garantiaAte: _garantia, ...aparelho }) => aparelho,
    ),
  }
}

/** Colunas da lista que o servidor sabe ordenar (as mesmas chaves das colunas da tabela). */
export const ORDENAVEIS_CLIENTE = ['id', 'nome', 'email', 'cpf'] as const
