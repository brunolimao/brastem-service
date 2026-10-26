import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { CreditCard, Minus, Plus } from 'lucide-react'
import { GraficoPizza } from '@/components/charts/grafico-pizza'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { FiltroPeriodo } from '@/components/domain/filtro-periodo'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaixa, useRemoverTransacao } from '@/hooks/use-financeiro'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { resolverPeriodo } from '@/libs/periodo'
import { buscaDePeriodo, numeroPositivo } from '@/libs/search-params'
import { cn } from '@/libs/utils'
import { type ItemCaixa, rotuloParcela } from '@/models/caixa.model'
import { ROTULO_TIPO_PAGAMENTO } from '@/models/pagamento.model'
import { ROTULO_CATEGORIA } from '@/models/transacao.model'

export const Route = createFileRoute('/_app/caixa/')({
  validateSearch: buscaDePeriodo.extend({ page: numeroPositivo }),
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: CaixaPage,
})

function Origem({ item }: { item: ItemCaixa }) {
  const remover = useRemoverTransacao()

  if (item.ordemServicoId !== null) {
    return (
      <Link
        to="/ordens-servico/$ordemId"
        params={{ ordemId: String(item.ordemServicoId) }}
        className="hover:underline"
      >
        OS {item.ordemServicoId}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span>
        {item.descricao}
        {item.categoria && (
          <span className="text-muted-foreground">
            {' '}
            · {ROTULO_CATEGORIA[item.categoria] ?? item.categoria}
          </span>
        )}
      </span>
      {item.transacaoId !== null && (
        <BotaoExcluir
          titulo={`Excluir o lançamento "${item.descricao}"?`}
          descricao="O valor e todas as parcelas desse lançamento saem do caixa. Isso não pode ser desfeito."
          aoConfirmar={() => remover.mutate(item.transacaoId as number)}
        />
      )}
    </div>
  )
}

const colunas: Coluna<ItemCaixa>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatarData(row.original.data) },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => (
      <span className={cn(row.original.valor < 0 && 'text-destructive')}>
        {formatarMoeda(row.original.valor)}
      </span>
    ),
  },
  { id: 'parcela', header: 'Parcela', cell: ({ row }) => rotuloParcela(row.original) },
  {
    accessorKey: 'tipo',
    header: 'Forma',
    cell: ({ row }) => ROTULO_TIPO_PAGAMENTO[row.original.tipo],
  },
  { id: 'origem', header: 'Origem', cell: ({ row }) => <Origem item={row.original} /> },
]

const SEM_DADOS: ItemCaixa[] = []

function CaixaPage() {
  const { inicio, fim, page } = Route.useSearch()
  const periodo = resolverPeriodo(inicio, fim)
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isLoading } = useCaixa(periodo, page)

  const formas = data
    ? Object.entries(data.formas).map(([tipo, quantidade]) => ({
        name: ROTULO_TIPO_PAGAMENTO[tipo as keyof typeof ROTULO_TIPO_PAGAMENTO],
        value: quantidade,
      }))
    : []

  return (
    <>
      <PageHeader
        titulo="Caixa"
        descricao="Entradas e saídas do período, por data de cada parcela."
        acoes={
          <>
            <Button asChild variant="outline">
              <Link to="/pagamentos">
                <CreditCard /> Pagamentos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/caixa/despesa">
                <Minus /> Despesa
              </Link>
            </Button>
            <Button asChild>
              <Link to="/caixa/receita">
                <Plus /> Receita
              </Link>
            </Button>
          </>
        }
      />
      <FiltroPeriodo
        key={`${periodo.inicio}-${periodo.fim}`}
        periodo={periodo}
        aoMudar={(novo) => navigate({ search: { ...novo, page: undefined } })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saldo do período</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'font-semibold text-4xl tracking-tight',
                data && data.total < 0 && 'text-destructive',
              )}
            >
              {data ? formatarMoeda(data.total) : '—'}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {data?.quantidade ?? 0} movimentações
            </p>
          </CardContent>
        </Card>
        <GraficoPizza titulo="Formas de pagamento" dados={formas} />
      </div>

      <DataTable
        colunas={colunas}
        dados={data?.itens ?? SEM_DADOS}
        carregando={isLoading}
        mensagemVazia="Nenhuma movimentação neste período"
        paginacao={{
          page: page ?? 1,
          pageSize: data?.pageSize ?? 20,
          total: data?.quantidade ?? 0,
          aoMudarPagina: (novaPagina) =>
            navigate({ search: (anterior) => ({ ...anterior, page: novaPagina }) }),
        }}
        classeDaLinha={(item) => (item.valor < 0 ? 'text-destructive' : undefined)}
      />
    </>
  )
}
