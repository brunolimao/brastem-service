import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TAMANHOS_DE_LETRA, usePreferenciasStore } from '@/hooks/use-preferencias-store'

const ROTULOS = ['Menor', 'Normal', 'Maior', 'Bem maior'] as const

/** Tamanho da letra de todo o sistema, neste computador (fica guardado). */
export function AparenciaCard() {
  const { tamanhoDeLetra, definirTamanhoDeLetra } = usePreferenciasStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Tamanho da letra de todo o sistema neste computador. Fica guardado para as próximas vezes.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
