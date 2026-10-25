import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/libs/utils'
import { erroDoCampo } from './form-errors'

interface CampoTextoProps
  extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  campo: AnyFieldApi
  rotulo: string
  /** Transforma o que foi digitado antes de guardar (ex.: máscaras). */
  formatar?: (valor: string) => string
}

export function CampoTexto({ campo, rotulo, formatar, className, ...props }: CampoTextoProps) {
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        {...props}
        id={id}
        name={campo.name}
        value={campo.state.value ?? ''}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        onBlur={campo.handleBlur}
        onChange={(evento) => {
          const valor = evento.target.value
          campo.handleChange(formatar ? formatar(valor) : valor)
        }}
      />
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  )
}
