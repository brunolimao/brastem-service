import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/libs/utils'
import { useFieldContext } from './contexto'

interface CampoCheckboxProps {
  rotulo: string
  className?: string
}

export function CampoCheckbox({ rotulo, className }: CampoCheckboxProps) {
  const campo = useFieldContext<boolean>()
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
