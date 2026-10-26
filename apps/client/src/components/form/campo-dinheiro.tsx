import { Input } from '@/components/ui/input'
import { centavosParaReais, reaisParaCentavos } from '@/libs/formatters'
import { useFieldContext } from './contexto'
import { erroDoCampo } from './form-errors'
import { ariaDoErro, MolduraCampo } from './moldura-campo'

interface CampoDinheiroProps {
  rotulo: string
  className?: string
}

/** Guarda o texto digitado ("1.250,5"); ao sair do campo, normaliza para "1.250,50". */
export function CampoDinheiro({ rotulo, className }: CampoDinheiroProps) {
  const campo = useFieldContext<string>()
  const erro = erroDoCampo(campo)
  const id = `campo-${campo.name}`

  return (
    <MolduraCampo id={id} rotulo={rotulo} erro={erro} className={className}>
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
          {...ariaDoErro(id, erro)}
          onChange={(evento) => campo.handleChange(evento.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={() => {
            const texto = campo.state.value ?? ''
            if (texto !== '' && !erro)
              campo.handleChange(centavosParaReais(reaisParaCentavos(texto)))
            campo.handleBlur()
          }}
        />
      </div>
    </MolduraCampo>
  )
}
