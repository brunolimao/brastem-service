import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { CreditCard, Minus, Plus } from 'lucide-react'
import { GraficoPizza } from '@/components/charts/grafico-pizza'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { FiltroPeriodo } from '@/components/domain/filtro-periodo'
import { EntradaSaida, GraficoSemanal } from '@/components/domain/modelos-telas'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaixa, useRemoverTransacao } from '@/hooks/use-financeiro'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { ordenacaoDaUrl, ordenacaoNaUrl, urlDaOrdenacao } from '@/libs/ordenacao'
import { resolverPeriodo } from '@/libs/periodo'
import { buscaDePeriodo, numeroPositivo } from '@/libs/search-params'
import { cn } from '@/libs/utils'
import { type ItemCaixa, ORDENAVEIS_CAIXA, rotuloParcela } from '@/models/caixa.model'
import { ROTULO_TIPO_PAGAMENTO } from '@/models/pagamento.model'
import { ROTULO_CATEGORIA } from '@/models/transacao.model'

export const Route = createFileRoute('/_app/caixa/')({
  validateSearch: buscaDePeriodo.extend({
    page: numeroPositivo,
    ...ordenacaoNaUrl(ORDENAVEIS_CAIXA),
  }),
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

/** D · Planilha (em teste): entrada e saída em colunas separadas, como num livro-caixa. */
const colunasDoLivro: Coluna<ItemCaixa>[] = colunas.flatMap((coluna) =>
  'accessorKey' in coluna && coluna.accessorKey === 'valor'
    ? [
        {
          accessorKey: 'valor',
          header: 'Entrada',
          cell: ({ row }) => <EntradaSaida valor={row.original.valor} lado="entrada" />,
        },
        {
          id: 'saida',
          header: 'Saída',
          cell: ({ row }) => <EntradaSaida valor={row.original.valor} lado="saida" />,
        },
      ]
    : [coluna],
)

function CaixaPage() {
  const { inicio, fim, page, ordem, direcao } = Route.useSearch()
  const periodo = resolverPeriodo(inicio, fim)
  const navigate = useNavigate({ from: Route.fullPath })
  const pageSize = usePreferenciasStore((estado) => estado.linhasPorPagina)
  const { data, isLoading } = useCaixa(periodo, { page, pageSize, ordem, direcao })
  const modelo = useThemeStore((estado) => estado.modelo)

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

      {modelo === 'planilha' ? (
        <section
          aria-label="Totais do período"
          className="grid grid-cols-2 rounded-sm border bg-card md:grid-cols-4"
        >
          <div className="border-r px-4 py-2.5">
            <p className="font-semibold text-muted-foreground text-xs uppercase">
              Saldo do período
            </p>
            <p
              className={cn(
                'font-semibold text-xl tabular-nums',
                data && data.total < 0 && 'text-destructive',
              )}
            >
              {data ? formatarMoeda(data.total) : '—'}
            </p>
          </div>
          <div className="border-r px-4 py-2.5">
            <p className="font-semibold text-muted-foreground text-xs uppercase">Movimentações</p>
            <p className="font-semibold text-xl tabular-nums">{data?.quantidade ?? 0}</p>
          </div>
          <div className="col-span-2 px-4 py-2.5">
            <p className="font-semibold text-muted-foreground text-xs uppercase">Por forma</p>
            <p className="text-sm">
              {formas.every((forma) => forma.value === 0)
                ? '—'
                : formas
                    .filter((forma) => forma.value > 0)
                    .map((forma) => `${forma.name}: ${forma.value}`)
                    .join(' · ')}
            </p>
          </div>
        </section>
      ) : modelo === 'cartoes' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <p className="font-semibold opacity-90">Sobrou no período</p>
              <p className="mt-1 font-extrabold text-4xl tabular-nums">
                {data ? formatarMoeda(data.total) : '—'}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-semibold text-muted-foreground">Movimentações</p>
              <p className="mt-1 font-extrabold text-4xl tabular-nums">{data?.quantidade ?? 0}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {formas
                  .filter((forma) => forma.value > 0)
                  .map((forma) => `${forma.name}: ${forma.value}`)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <GraficoSemanal periodo={periodo} />
        </>
      ) : (
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
      )}

      <DataTable
        colunas={modelo === 'planilha' ? colunasDoLivro : colunas}
        dados={data?.itens ?? SEM_DADOS}
        carregando={isLoading}
        mensagemVazia="Nenhuma movimentação neste período"
        acaoVazia={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/caixa/despesa">
                <Minus /> Lançar despesa
              </Link>
            </Button>
            <Button asChild>
              <Link to="/caixa/receita">
                <Plus /> Lançar receita
              </Link>
            </Button>
          </div>
        }
        ordenaveis={ORDENAVEIS_CAIXA}
        ordenacao={ordenacaoDaUrl({ ordem, direcao })}
        aoOrdenar={(nova) =>
          navigate({
            search: (anterior) => ({ ...anterior, ...urlDaOrdenacao(nova, ORDENAVEIS_CAIXA) }),
          })
        }
        paginacao={{
          page: page ?? 1,
          pageSize,
          total: data?.quantidade ?? 0,
          aoMudarPagina: (novaPagina) =>
            navigate({ search: (anterior) => ({ ...anterior, page: novaPagina }) }),
        }}
        classeDaLinha={(item) =>
          item.valor < 0 && modelo !== 'planilha' ? 'text-destructive' : undefined
        }
      />
    </>
  )
}
