import { type AnyFieldApi, useStore } from '@tanstack/react-form'

/**
 * Primeira mensagem de erro do campo (string ou issue do Zod), só depois que o usuário digitou nele
 * ou tentou salvar (R-UX-18). Só passar pelo campo não conta: o Nome começa com o cursor, e sair dele
 * para o CEP acusava "Informe o nome" antes de a pessoa chegar lá.
 */
export function useErroDoCampo(campo: AnyFieldApi): string | undefined {
  const tentouSalvar = useStore(campo.form.store, (estado) => estado.submissionAttempts > 0)
  const { isDirty, isTouched, errors } = campo.state.meta
  if (!isDirty && !(isTouched && tentouSalvar)) return undefined
  for (const erro of errors) {
    if (typeof erro === 'string') return erro
    if (erro && typeof erro === 'object' && 'message' in erro) return String(erro.message)
  }
  return undefined
}
