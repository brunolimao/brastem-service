import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/libs/utils'
import { useFieldContext } from './contexto'

interface CampoOpcoesProps {
  rotulo: string
  opcoes: readonly { valor: string; rotulo: string }[]
  className?: string
}

/** Escolha única entre poucas opções, todas visíveis (substitui os radios do sistema antigo). */
export function CampoOpcoes({ rotulo, opcoes, className }: CampoOpcoesProps) {
  const campo = useFieldContext<string>()
  return (
    <fieldset className={cn('grid gap-2', className)}>
      <legend className="font-medium text-sm">{rotulo}</legend>
      <RadioGroup
        value={campo.state.value}
        onValueChange={(valor) => campo.handleChange(valor)}
        className="flex flex-wrap gap-x-5 gap-y-2"
      >
        {opcoes.map((opcao) => {
          const id = `${campo.name}-${opcao.valor}`
          return (
            <div key={opcao.valor} className="flex items-center gap-2">
              <RadioGroupItem id={id} value={opcao.valor} />
              <Label htmlFor={id} className="font-normal">
                {opcao.rotulo}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}
