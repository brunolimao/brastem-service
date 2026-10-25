import type { AnyFieldApi } from '@tanstack/react-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/libs/utils'

interface CampoCheckboxProps {
  campo: AnyFieldApi
  rotulo: string
  className?: string
}

export function CampoCheckbox({ campo, rotulo, className }: CampoCheckboxProps) {
  const id = `campo-${campo.name}`
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Checkbox
        id={id}
        checked={Boolean(campo.state.value)}
        onCheckedChange={(marcado) => campo.handleChange(marcado === true)}
      />
      <Label htmlFor={id} className="font-normal">
        {rotulo}
      </Label>
    </div>
  )
}
