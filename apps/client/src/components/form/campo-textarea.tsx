import type { ComponentProps } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useFieldContext } from './contexto'
import { useErroDoCampo } from './form-errors'
import { ariaDoErro, MolduraCampo } from './moldura-campo'

interface CampoTextareaProps
  extends Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  rotulo: string
}

export function CampoTextarea({ rotulo, className, ...props }: CampoTextareaProps) {
  const campo = useFieldContext<string>()
  const erro = useErroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <MolduraCampo id={id} rotulo={rotulo} erro={erro} className={className}>
      <Textarea
        {...props}
        id={id}
        name={campo.name}
        value={campo.state.value ?? ''}
        {...ariaDoErro(id, erro)}
        onBlur={campo.handleBlur}
        onChange={(evento) => campo.handleChange(evento.target.value)}
      />
    </MolduraCampo>
  )
}
