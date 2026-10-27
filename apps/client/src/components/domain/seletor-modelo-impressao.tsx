import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MODELOS_DE_IMPRESSAO,
  type ModeloDeImpressao,
  usePreferenciasStore,
} from '@/hooks/use-preferencias-store'

const ROTULOS: Record<ModeloDeImpressao, string> = {
  novo: 'Modelo novo',
  antigo: 'Igual ao sistema antigo',
}

/** Escolhe o modelo da OS impressa; a escolha fica guardada neste computador (R-IMP-03). */
export function SeletorModeloImpressao() {
  const { modeloDeImpressao, definirModeloDeImpressao } = usePreferenciasStore()

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Modelo de impressão</legend>
      {MODELOS_DE_IMPRESSAO.map((modelo) => (
        <Button
          key={modelo}
          variant={modelo === modeloDeImpressao ? 'default' : 'outline'}
          aria-pressed={modelo === modeloDeImpressao}
          onClick={() => definirModeloDeImpressao(modelo)}
        >
          {ROTULOS[modelo]}
        </Button>
      ))}
    </fieldset>
  )
}

/** Cartão de Configurações com o mesmo seletor da página de impressão. */
export function ImpressaoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressão da OS</CardTitle>
        <CardDescription>
          Modelo da ordem de serviço impressa neste computador. Também dá para trocar na própria
          página de impressão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SeletorModeloImpressao />
      </CardContent>
    </Card>
  )
}
