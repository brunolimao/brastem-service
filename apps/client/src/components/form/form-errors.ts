import type { AnyFieldApi } from '@tanstack/react-form'

/** Primeira mensagem de erro do campo (string ou issue do Zod), só depois que o usuário mexeu nele. */
export function erroDoCampo(campo: AnyFieldApi): string | undefined {
  const { isTouched, errors } = campo.state.meta
  if (!isTouched) return undefined
  for (const erro of errors) {
    if (typeof erro === 'string') return erro
    if (erro && typeof erro === 'object' && 'message' in erro) return String(erro.message)
  }
  return undefined
}
