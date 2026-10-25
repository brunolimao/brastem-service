import type { AnyFieldApi } from '@tanstack/react-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { centavosParaReais, reaisParaCentavos } from '@/libs/formatters'
import { cn } from '@/libs/utils'
import { erroDoCampo } from './form-errors'

interface CampoDinheiroProps {
  campo: AnyFieldApi
  rotulo: string
  className?: string
}

/** Guarda o texto digitado ("1.250,5"); ao sair do campo, normaliza para "1.250,50". */
export function CampoDinheiro({ campo, rotulo, className }: CampoDinheiroProps) {
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-muted-foreground text-sm">
          R$
        </span>
        <Input
          id={id}
          name={campo.name}
          inputMode="decimal"
          className="pl-9"
          placeholder="0,00"
          value={campo.state.value ?? ''}
          aria-invalid={erro ? true : undefined}
          onChange={(evento) => campo.handleChange(evento.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={() => {
            const texto = String(campo.state.value ?? '')
            if (texto !== '' && !erro)
              campo.handleChange(centavosParaReais(reaisParaCentavos(texto)))
            campo.handleBlur()
          }}
        />
      </div>
      {erro && (
        <p role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  )
}
