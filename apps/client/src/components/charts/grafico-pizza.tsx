import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactEChartsCoreModulo from 'echarts-for-react/lib/core'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dica } from '@/components/ui/tooltip'
import { useThemeStore } from '@/hooks/use-theme-store'
import { corDoTema } from '@/libs/cores'
import {
  type CoresGrafico,
  type FatiaGrafico,
  fatiasColoridas,
  montarOpcaoPizza,
  PALETA_PADRAO,
  RESERVA_PADRAO,
} from './opcao-pizza'

// O pacote é CommonJS: dependendo do empacotador, o componente vem em `.default` do import padrão.
const ReactEChartsCore = ((
  ReactEChartsCoreModulo as unknown as { default?: typeof ReactEChartsCoreModulo }
).default ?? ReactEChartsCoreModulo) as typeof ReactEChartsCoreModulo

// Só os pedaços do echarts que usamos entram no pacote.
echarts.use([PieChart, TitleComponent, TooltipComponent, CanvasRenderer])

interface GraficoPizzaProps {
  titulo: string
  dados: FatiaGrafico[]
  /** Variáveis do tema, em ordem (padrão: `--chart-1` a `--chart-7`). */
  cores?: string[]
}

/** Lê as cores do tema atual; muda junto quando o tema (claro/escuro) muda. */
function useCoresGrafico(variaveis: string[]): CoresGrafico {
  const tema = useThemeStore((estado) => estado.tema)
  const chave = variaveis.join()
  // biome-ignore lint/correctness/useExhaustiveDependencies: o tema muda as variáveis do CSS
  return useMemo(
    () => ({
      fatias: variaveis.map((variavel, indice) =>
        corDoTema(variavel, RESERVA_PADRAO[indice % RESERVA_PADRAO.length] as string),
      ),
      texto: corDoTema('--foreground', '#1f2937'),
      suave: corDoTema('--muted-foreground', '#6b7280'),
      fundo: corDoTema('--card', '#ffffff'),
    }),
    [chave, tema],
  )
}

export function GraficoPizza({ titulo, dados, cores = PALETA_PADRAO }: GraficoPizzaProps) {
  const paleta = useCoresGrafico(cores)
  const total = dados.reduce((soma, fatia) => soma + fatia.value, 0)
  const legenda = fatiasColoridas(dados, paleta.fatias).filter((fatia) => fatia.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {total === 0 ? (
          <p className="grid h-64 place-items-center text-muted-foreground text-sm">
            Sem dados no período
          </p>
        ) : (
          <>
            <ReactEChartsCore
              echarts={echarts}
              option={montarOpcaoPizza(dados, paleta)}
              style={{ height: 220 }}
              notMerge
            />
            {/* Legenda em HTML: quebra linha em vez de cobrir o gráfico, e serve a leitores de tela. */}
            <ul aria-label={`Legenda: ${titulo}`} className="grid gap-1 text-sm">
              {legenda.map((fatia) => (
                <li key={fatia.name} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: fatia.itemStyle.color }}
                  />
                  <Dica texto={fatia.name}>
                    <span className="min-w-0 flex-1 truncate">{fatia.name}</span>
                  </Dica>
                  <span className="tabular-nums">{fatia.value}</span>
                  <span className="w-11 text-right text-muted-foreground tabular-nums">
                    {Math.round((fatia.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
