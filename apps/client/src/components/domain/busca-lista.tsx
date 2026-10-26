import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BuscaListaProps<C extends string> {
  campos: readonly { valor: C; rotulo: string }[]
  campo: C | undefined
  busca: string | undefined
  placeholder?: string
  aoBuscar: (busca: { campo: C; busca: string }) => void
}

/**
 * Campo + texto de busca das listagens. Os valores ficam na URL (search params) via `aoBuscar`.
 * A `key` recomeça o formulário quando a URL muda por fora (voltar do navegador, "Ver todas"):
 * sem ela, a caixa continuava mostrando o texto antigo.
 */
export const BuscaLista = <C extends string>(props: BuscaListaProps<C>) => (
  <FormularioBusca key={`${props.campo ?? ''}|${props.busca ?? ''}`} {...props} />
)

function FormularioBusca<C extends string>({
  campos,
  campo,
  busca,
  placeholder,
  aoBuscar,
}: BuscaListaProps<C>) {
  // Sem campo na URL, o primeiro da lista (sempre "Todos").
  const [campoAtual, setCampoAtual] = useState<C | undefined>(campo ?? campos[0]?.valor)
  const [texto, setTexto] = useState(busca ?? '')

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (campoAtual) aoBuscar({ campo: campoAtual, busca: texto.trim() })
      }}
    >
      <Select value={campoAtual} onValueChange={(valor) => setCampoAtual(valor as C)}>
        <SelectTrigger className="w-48" aria-label="Buscar em">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {campos.map((item) => (
            <SelectItem key={item.valor} value={item.valor}>
              {item.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="max-w-sm flex-1"
        placeholder={placeholder ?? 'Buscar...'}
        aria-label="Texto da busca"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
      />
      <Button type="submit">
        <Search /> Pesquisar
      </Button>
    </form>
  )
}
