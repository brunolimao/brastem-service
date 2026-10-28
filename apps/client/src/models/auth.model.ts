import type { Role } from '@brastem/shared'
import { z } from 'zod'

/** Quem está logado (resposta de `/auth/me` e do login). */
export interface SessaoUsuario {
  id: number
  usuario: string
  role: Role
}

export const loginSchema = z.object({
  usuario: z.string().min(1, 'Informe o usuário'),
  senha: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const primeiroAcessoSchema = z
  .object({
    usuario: z
      .string()
      .min(3, 'Use pelo menos 3 caracteres')
      .max(50, 'Use no máximo 50 caracteres'),
    senha: z
      .string()
      .min(8, 'Use pelo menos 8 caracteres')
      .max(100, 'Use no máximo 100 caracteres'),
    confirmarSenha: z.string().min(1, 'Repita a senha'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })
