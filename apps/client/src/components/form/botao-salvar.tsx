import { Button } from '@/components/ui/button'
import { useFormContext } from './contexto'

interface BotaoSalvarProps {
  texto?: string
  textoEnviando?: string
  className?: string
}

/** Botão de envio que se desabilita e muda o texto enquanto o formulário salva. */
export function BotaoSalvar({
  texto = 'Salvar',
  textoEnviando = 'Salvando...',
  className,
}: BotaoSalvarProps) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(estado) => estado.isSubmitting}>
      {(enviando) => (
        <Button type="submit" disabled={enviando} className={className}>
          {enviando ? textoEnviando : texto}
        </Button>
      )}
    </form.Subscribe>
  )
}
