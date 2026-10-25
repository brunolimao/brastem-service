import type { AnyFieldApi } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/libs/utils'
import { erroDoCampo } from './form-errors'

interface CampoSelectProps {
  campo: AnyFieldApi
  rotulo: string
  opcoes: readonly { valor: string; rotulo: string }[]
  className?: string
}

export function CampoSelect({ campo, rotulo, opcoes, className }: CampoSelectProps) {
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      <Select
        value={campo.state.value ?? ''}
        onValueChange={(valor) => campo.handleChange(valor)}
        name={campo.name}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={erro ? true : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro && (
        <p role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  )
}
