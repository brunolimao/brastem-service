import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useFormContext } from './contexto'

interface BotaoSalvarProps {
  texto?: string
  textoEnviando?: string
  className?: string
}

const ATRIBUTO = 'data-atalho-salvar'

/**
 * O Ctrl+S é deste botão? Sim se o cursor está no formulário dele, ou se ele é o único botão de salvar
 * da tela. Nunca com um diálogo aberto por cima de um formulário que não está nele.
 */
function ehDesteBotao(botao: HTMLButtonElement) {
  const formulario = botao.form
  if (!formulario || botao.disabled) return false
  const dialogo = document.querySelector('[role="dialog"], [role="alertdialog"]')
  if (dialogo && !dialogo.contains(formulario)) return false
  if (formulario.contains(document.activeElement)) return true
  return document.querySelectorAll(`[${ATRIBUTO}]`).length === 1
}

/**
 * Botão de envio que se desabilita e muda o texto enquanto o formulário salva. **Ctrl+S** salva, e,
 * se o formulário tiver erro, a tela rola até o primeiro campo errado e o cursor vai para ele.
 */
export function BotaoSalvar({
  texto = 'Salvar',
  textoEnviando = 'Salvando...',
  className,
}: BotaoSalvarProps) {
  const form = useFormContext()
  const botao = useRef<HTMLButtonElement>(null)
  const tentativas = useStore(form.store, (estado) => estado.submissionAttempts)
  const valido = useStore(form.store, (estado) => estado.isValid)

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (!(evento.ctrlKey || evento.metaKey) || evento.key.toLowerCase() !== 's') return
      const elemento = botao.current
      if (!elemento || !ehDesteBotao(elemento)) return
      // Não abre o "Salvar página" do navegador.
      evento.preventDefault()
      elemento.form?.requestSubmit(elemento)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  // Tentou salvar com erro: leva até o primeiro campo errado (as mensagens aparecem no mesmo render).
  useEffect(() => {
    if (tentativas === 0 || valido) return
    const campo = botao.current?.form?.querySelector<HTMLElement>('[aria-invalid="true"]')
    campo?.scrollIntoView({ block: 'center' })
    campo?.focus()
  }, [tentativas, valido])

  return (
    <form.Subscribe selector={(estado) => estado.isSubmitting}>
      {(enviando) => (
        <Button
          ref={botao}
          type="submit"
          disabled={enviando}
          className={className}
          title={`${texto} (Ctrl+S)`}
          {...{ [ATRIBUTO]: '' }}
        >
          {enviando ? textoEnviando : texto}
        </Button>
      )}
    </form.Subscribe>
  )
}
