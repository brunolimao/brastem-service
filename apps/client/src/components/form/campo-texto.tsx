import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { useFieldContext } from './contexto'
import { erroDoCampo } from './form-errors'
import { ariaDoErro, MolduraCampo } from './moldura-campo'

interface CampoTextoProps
  extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  rotulo: string
  /** Transforma o que foi digitado antes de guardar (ex.: máscaras). */
  formatar?: (valor: string) => string
}

/** Uso: `<form.AppField name="nome">{(campo) => <campo.CampoTexto rotulo="Nome" />}</form.AppField>` */
export function CampoTexto({ rotulo, formatar, className, ...props }: CampoTextoProps) {
  const campo = useFieldContext<string>()
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <MolduraCampo id={id} rotulo={rotulo} erro={erro} className={className}>
      <Input
        {...props}
        id={id}
        name={campo.name}
        value={campo.state.value ?? ''}
        {...ariaDoErro(id, erro)}
        onBlur={campo.handleBlur}
        onChange={(evento) => {
          const valor = evento.target.value
          campo.handleChange(formatar ? formatar(valor) : valor)
        }}
      />
    </MolduraCampo>
  )
}
