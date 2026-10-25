import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/libs/utils'
import { erroDoCampo } from './form-errors'

interface CampoTextareaProps
  extends Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  campo: AnyFieldApi
  rotulo: string
}

export function CampoTextarea({ campo, rotulo, className, ...props }: CampoTextareaProps) {
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      <Textarea
        {...props}
        id={id}
        name={campo.name}
        value={campo.state.value ?? ''}
        aria-invalid={erro ? true : undefined}
        onBlur={campo.handleBlur}
        onChange={(evento) => campo.handleChange(evento.target.value)}
      />
      {erro && (
        <p role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  )
}
