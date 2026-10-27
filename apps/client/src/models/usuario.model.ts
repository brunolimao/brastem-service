import { ROLES } from '@brastem/shared'
import { z } from 'zod'

export const usuarioSchema = z.object({
  id: z.number(),
  usuario: z.string(),
  role: z.enum(ROLES),
  ativo: z.boolean(),
  criadoEm: z.string(),
})
export type Usuario = z.infer<typeof usuarioSchema>

export const criarUsuarioSchema = z.object({
  usuario: z.string().min(3, 'Use pelo menos 3 caracteres').max(50, 'Use no máximo 50 caracteres'),
  senha: z.string().min(8, 'Use pelo menos 8 caracteres').max(100, 'Use no máximo 100 caracteres'),
  role: z.enum(ROLES),
})
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>

export const ROTULO_ROLE: Record<(typeof ROLES)[number], string> = {
  admin: 'Administrador',
  usuario: 'Usuário',
}

/** Colunas da lista que o servidor sabe ordenar (as mesmas chaves das colunas da tabela). */
export const ORDENAVEIS_USUARIO = ['id', 'usuario', 'role', 'criadoEm'] as const
