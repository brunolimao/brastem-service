import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type Periodo, periodoDeHoje, periodoDoAno, periodoDoMes } from '@/libs/periodo'

interface FiltroPeriodoProps {
  periodo: Periodo
  aoMudar: (periodo: Periodo) => void
  /** Quando informado, mostra o botão que remove o filtro de período. */
  aoLimpar?: () => void
}

/** De/até (as duas datas entram no resultado) com atalhos para hoje, mês e ano. */
export function FiltroPeriodo({ periodo, aoMudar, aoLimpar }: FiltroPeriodoProps) {
  const [inicio, setInicio] = useState(periodo.inicio)
  const [fim, setFim] = useState(periodo.fim)

  const aplicar = (novo: Periodo) => {
    setInicio(novo.inicio)
    setFim(novo.fim)
    aoMudar(novo)
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (inicio && fim) aplicar({ inicio, fim })
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="periodo-inicio">De</Label>
        <Input
          id="periodo-inicio"
          type="date"
          value={inicio}
          max={fim || undefined}
          onChange={(evento) => setInicio(evento.target.value)}
          className="w-44"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="periodo-fim">Até</Label>
        <Input
          id="periodo-fim"
          type="date"
          value={fim}
          min={inicio || undefined}
          onChange={(evento) => setFim(evento.target.value)}
          className="w-44"
        />
      </div>
      <Button type="submit" disabled={!inicio || !fim || inicio > fim}>
        Pesquisar
      </Button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => aplicar(periodoDeHoje())}>
          Hoje
        </Button>
        <Button type="button" variant="outline" onClick={() => aplicar(periodoDoMes())}>
          Mês
        </Button>
        <Button type="button" variant="outline" onClick={() => aplicar(periodoDoAno())}>
          Ano
        </Button>
        {aoLimpar && (
          <Button type="button" variant="ghost" onClick={aoLimpar}>
            Todo o período
          </Button>
        )}
      </div>
    </form>
  )
}
