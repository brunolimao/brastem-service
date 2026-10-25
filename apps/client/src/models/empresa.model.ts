import { z } from 'zod'

/** Dados da empresa que saem no cabeçalho da OS impressa. Ficam só no banco de cada instalação. */
export interface Empresa {
  nome: string
  cnpj: string
  telefone: string
  endereco: string
  cep: string
}

export const empresaVazia: Empresa = { nome: '', cnpj: '', telefone: '', endereco: '', cep: '' }

export const empresaFormSchema = z.object({
  nome: z.string().max(120, 'Use no máximo 120 caracteres'),
  cnpj: z.string().max(30, 'Use no máximo 30 caracteres'),
  telefone: z.string().max(30, 'Use no máximo 30 caracteres'),
  endereco: z.string().max(200, 'Use no máximo 200 caracteres'),
  cep: z.string().max(20, 'Use no máximo 20 caracteres'),
})
export type EmpresaForm = z.infer<typeof empresaFormSchema>
