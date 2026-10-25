import { RECOMENDACOES, STATUS_OS } from '@brastem/shared'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { GraficoPizza } from '@/components/charts/grafico-pizza'
import { FiltroPeriodo } from '@/components/domain/filtro-periodo'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRelatorio } from '@/hooks/use-financeiro'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarMoeda } from '@/libs/formatters'
import { resolverPeriodo } from '@/libs/periodo'
import { buscaDePeriodo } from '@/libs/search-params'
import { ROTULO_RECOMENDACAO } from '@/models/cliente.model'
import { ROTULO_STATUS } from '@/models/ordem-servico.model'
import { percentual } from '@/models/relatorio.model'

export const Route = createFileRoute('/_app/relatorios')({
  validateSearch: buscaDePeriodo,
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: RelatoriosPage,
})

// Uma cor por status, na ordem de STATUS_OS: aberto, aguardando, aprovado, fechado, cancelado.
const CORES_STATUS = ['#5b8def', '#fac858', '#9a60b4', '#3ba272', '#ee6666']

interface IndicadorProps {
  titulo: string
  valor: string
  detalhe: string
}

function Indicador({ titulo, valor, detalhe }: IndicadorProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-3xl tracking-tight">{valor}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">{detalhe}</CardContent>
    </Card>
  )
}

function RelatoriosPage() {
  const { inicio, fim } = Route.useSearch()
  const periodo = resolverPeriodo(inicio, fim)
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isLoading } = useRelatorio(periodo)

  return (
    <>
      <PageHeader
        titulo="Relatórios"
        descricao="Ordens de serviço pela data de abertura e clientes novos pela data de cadastro."
      />
      <FiltroPeriodo
        key={`${periodo.inicio}-${periodo.fim}`}
        periodo={periodo}
        aoMudar={(novo) => navigate({ search: novo })}
      />

      {isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Indicador
              titulo="Faturamento fechado"
              valor={formatarMoeda(data.kpis.valorFechado)}
              detalhe={`de ${formatarMoeda(data.kpis.valorTotal)} em ordens fora de garantia (${percentual(
                data.kpis.valorFechado,
                data.kpis.valorTotal,
              )}%)`}
            />
            <Indicador
              titulo="Atendimentos em garantia"
              valor={String(data.kpis.ordensEmGarantia)}
              detalhe={`de ${data.kpis.totalOrdens} ordens (${percentual(
                data.kpis.ordensEmGarantia,
                data.kpis.totalOrdens,
              )}%)`}
            />
            <Indicador
              titulo="Clientes novos"
              valor={String(data.kpis.novosClientes)}
              detalhe="cadastrados no período"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <GraficoPizza
              titulo="Ordens por status"
              cores={CORES_STATUS}
              dados={STATUS_OS.map((status) => ({
                name: ROTULO_STATUS[status],
                value: data.status[status],
              }))}
            />
            <GraficoPizza
              titulo="Ordens por origem do cliente"
              dados={RECOMENDACOES.map((item) => ({
                name: ROTULO_RECOMENDACAO[item],
                value: data.recomendacaoOrdens[item],
              }))}
            />
            <GraficoPizza
              titulo="Clientes novos por origem"
              dados={RECOMENDACOES.map((item) => ({
                name: ROTULO_RECOMENDACAO[item],
                value: data.recomendacaoClientes[item],
              }))}
            />
            <GraficoPizza titulo="Clientes novos por cidade" dados={data.cidades.slice(0, 7)} />
            <GraficoPizza titulo="Clientes novos por bairro" dados={data.bairros.slice(0, 7)} />
          </div>
        </>
      )}
    </>
  )
}
