import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFieldContext } from './contexto'
import { useErroDoCampo } from './form-errors'
import { ariaDoErro, MolduraCampo } from './moldura-campo'

interface CampoSelectProps {
  rotulo: string
  opcoes: readonly { valor: string; rotulo: string }[]
  className?: string
}

export function CampoSelect({ rotulo, opcoes, className }: CampoSelectProps) {
  const campo = useFieldContext<string>()
  const erro = useErroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <MolduraCampo id={id} rotulo={rotulo} erro={erro} className={className}>
      <Select
        value={campo.state.value ?? ''}
        onValueChange={(valor) => campo.handleChange(valor)}
        name={campo.name}
      >
        <SelectTrigger id={id} className="w-full" {...ariaDoErro(id, erro)}>
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
    </MolduraCampo>
  )
}
