import { PieChart } from 'echarts/charts'
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactEChartsCoreModulo from 'echarts-for-react/lib/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { temaEfetivo, useThemeStore } from '@/hooks/use-theme-store'
import { type FatiaGrafico, montarOpcaoPizza } from './opcao-pizza'

// O pacote é CommonJS: dependendo do empacotador, o componente vem em `.default` do import padrão.
const ReactEChartsCore = ((
  ReactEChartsCoreModulo as unknown as { default?: typeof ReactEChartsCoreModulo }
).default ?? ReactEChartsCoreModulo) as typeof ReactEChartsCoreModulo

// Só os pedaços do echarts que usamos entram no pacote.
echarts.use([PieChart, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])

interface GraficoPizzaProps {
  titulo: string
  dados: FatiaGrafico[]
  cores?: string[]
}

export function GraficoPizza({ titulo, dados, cores }: GraficoPizzaProps) {
  const tema = useThemeStore((estado) => estado.tema)
  const total = dados.reduce((soma, fatia) => soma + fatia.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="grid h-64 place-items-center text-muted-foreground text-sm">
            Sem dados no período
          </p>
        ) : (
          <>
            <ReactEChartsCore
              echarts={echarts}
              option={montarOpcaoPizza({ dados, cores, escuro: temaEfetivo(tema) === 'escuro' })}
              style={{ height: 280 }}
              notMerge
            />
            {/* Mesmos números em texto, para leitores de tela. */}
            <ul className="sr-only">
              {dados.map((fatia) => (
                <li key={fatia.name}>
                  {fatia.name}: {fatia.value}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
