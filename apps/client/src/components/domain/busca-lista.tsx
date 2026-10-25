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

interface BuscaListaProps {
  campos: readonly { valor: string; rotulo: string }[]
  campo: string | undefined
  busca: string | undefined
  placeholder?: string
  aoBuscar: (busca: { campo: string; busca: string }) => void
}

/** Campo + texto de busca das listagens. Os valores ficam na URL (search params) via `aoBuscar`. */
export function BuscaLista({ campos, campo, busca, placeholder, aoBuscar }: BuscaListaProps) {
  const [campoAtual, setCampoAtual] = useState(campo ?? 'todos')
  const [texto, setTexto] = useState(busca ?? '')

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoBuscar({ campo: campoAtual, busca: texto.trim() })
      }}
    >
      <Select value={campoAtual} onValueChange={setCampoAtual}>
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
