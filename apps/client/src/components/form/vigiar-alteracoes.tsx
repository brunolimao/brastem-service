import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { useAlteracoesPendentesStore } from '@/hooks/use-alteracoes-pendentes'
import { useFormContext } from './contexto'

/**
 * Avisa o "sair sem salvar" (layout do app) quando o que está na tela é diferente do último salvo.
 * Navegar durante o salvamento (ex.: voltar para a lista depois de salvar) não conta como sair sem salvar.
 *
 *   <form.AppForm><form.VigiarAlteracoes /></form.AppForm>
 */
export function VigiarAlteracoes() {
  const form = useFormContext()
  const salvo = useRef(JSON.stringify(form.state.values))
  const enviando = useStore(form.store, (estado) => estado.isSubmitting)
  const estavaEnviando = useRef(false)

  // Terminou um envio com sucesso: o que está na tela passa a ser o "salvo".
  useEffect(() => {
    if (estavaEnviando.current && !enviando && form.state.isSubmitSuccessful) {
      salvo.current = JSON.stringify(form.state.values)
    }
    estavaEnviando.current = enviando
  }, [enviando, form])

  const { registrar, remover } = useAlteracoesPendentesStore()
  useEffect(() => {
    const id = Symbol('formulario')
    registrar(
      id,
      () => !form.state.isSubmitting && JSON.stringify(form.state.values) !== salvo.current,
    )
    return () => remover(id)
  }, [form, registrar, remover])

  return null
}
