import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TAMANHOS_DE_LETRA, usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { PALETAS } from '@/libs/paletas'
import { cn } from '@/libs/utils'

const ROTULOS = ['Menor', 'Normal', 'Maior', 'Bem maior'] as const

/** Tamanho da letra e cores de todo o sistema, neste computador (ficam guardados). */
export function AparenciaCard() {
  const { tamanhoDeLetra, definirTamanhoDeLetra } = usePreferenciasStore()
  const { paleta: paletaAtual, definirPaleta } = useThemeStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Tamanho da letra e cores de todo o sistema neste computador. Ficam guardados para as
          próximas vezes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Tamanho da letra</legend>
          {TAMANHOS_DE_LETRA.map((tamanho, indice) => (
            <Button
              key={tamanho}
              variant={indice === tamanhoDeLetra ? 'default' : 'outline'}
              aria-pressed={indice === tamanhoDeLetra}
              onClick={() => definirTamanhoDeLetra(indice)}
            >
              {ROTULOS[indice]}
            </Button>
          ))}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-2 font-medium text-sm">Cores</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PALETAS.map((paleta) => {
              const escolhida = paleta.id === paletaAtual
              return (
                <button
                  key={paleta.id}
                  type="button"
                  aria-pressed={escolhida}
                  onClick={() => definirPaleta(paleta.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                    escolhida && 'border-primary ring-2 ring-primary/40',
                  )}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-sm border" aria-hidden>
                    {[paleta.menu, paleta.primaria, paleta.destaque].map((cor) => (
                      <span key={cor} className="size-5" style={{ background: cor }} />
                    ))}
                  </span>
                  {paleta.nome}
                </button>
              )
            })}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}
