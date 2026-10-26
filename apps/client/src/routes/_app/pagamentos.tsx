import { TIPOS_PAGAMENTO, type TipoPagamento } from '@brastem/shared'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BuscaLista } from '@/components/domain/busca-lista'
import { FiltroPeriodo } from '@/components/domain/filtro-periodo'
import { ParcelasDialog } from '@/components/domain/parcelas-dialog'
import { PageHeader } from '@/components/layout/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePagamentos } from '@/hooks/use-financeiro'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { resolverPeriodo } from '@/libs/periodo'
import { buscaDePeriodo, numeroPositivo, textoDeBusca, umDos } from '@/libs/search-params'
import { cn } from '@/libs/utils'
import { type PagamentoListado, ROTULO_TIPO_PAGAMENTO } from '@/models/pagamento.model'

const CAMPOS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'id', rotulo: 'Código' },
  { valor: 'valor', rotulo: 'Valor' },
  { valor: 'observacao', rotulo: 'Observação' },
] as const

export const Route = createFileRoute('/_app/pagamentos')({
  validateSearch: buscaDePeriodo.extend({
    busca: textoDeBusca,
    campo: umDos(CAMPOS),
    tipo: z.enum(TIPOS_PAGAMENTO).optional().catch(undefined),
    page: numeroPositivo,
  }),
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: PagamentosPage,
})

const colunas: Coluna<PagamentoListado>[] = [
  { accessorKey: 'id', header: 'Código' },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => (
      <span className={cn(row.original.valor < 0 && 'text-destructive')}>
        {formatarMoeda(row.original.valor)}
      </span>
    ),
  },
  { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatarData(row.original.data) },
  {
    accessorKey: 'parcelas',
    header: 'Parcelas',
    cell: ({ row }) => (row.original.parcelas === 0 ? 'À vista' : `${row.original.parcelas}x`),
  },
  {
    accessorKey: 'tipo',
    header: 'Forma',
    cell: ({ row }) => ROTULO_TIPO_PAGAMENTO[row.original.tipo],
  },
  { accessorKey: 'observacao', header: 'Observação' },
  {
    id: 'origem',
    header: 'Origem',
    cell: ({ row }) =>
      row.original.ordemServicoId !== null ? (
        <Link
          to="/ordens-servico/$ordemId"
          params={{ ordemId: String(row.original.ordemServicoId) }}
          className="hover:underline"
        >
          OS {row.original.ordemServicoId}
        </Link>
      ) : (
        <span className="text-muted-foreground">Lançamento {row.original.transacaoId}</span>
      ),
  },
  {
    id: 'parcelas-ver',
    header: '',
    cell: ({ row }) => <ParcelasDialog pagamentoId={row.original.id} />,
  },
]

const SEM_DADOS: PagamentoListado[] = []

function PagamentosPage() {
  const { busca, campo, tipo, inicio, fim, page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  // Sem datas na URL vale o mês atual: o mesmo período que o filtro mostra (como no Caixa).
  const periodo = resolverPeriodo(inicio, fim)
  const { data, isLoading } = usePagamentos({ busca, campo, tipo, ...periodo, page })

  return (
    <>
      <PageHeader
        titulo="Pagamentos"
        descricao="Todos os pagamentos lançados, com as parcelas de cada um."
      />
      <FiltroPeriodo
        key={`${periodo.inicio}-${periodo.fim}`}
        periodo={periodo}
        aoMudar={(novo) =>
          navigate({ search: (anterior) => ({ ...anterior, ...novo, page: undefined }) })
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <BuscaLista
          campos={CAMPOS}
          campo={campo}
          busca={busca}
          placeholder="Código, valor ou observação"
          aoBuscar={(novo) =>
            navigate({
              search: (anterior) => ({
                ...anterior,
                busca: novo.busca || undefined,
                campo: novo.campo,
                page: undefined,
              }),
            })
          }
        />
        <Select
          value={tipo ?? 'todos'}
          onValueChange={(valor) =>
            navigate({
              search: (anterior) => ({
                ...anterior,
                tipo: valor === 'todos' ? undefined : (valor as TipoPagamento),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-44" aria-label="Forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as formas</SelectItem>
            {TIPOS_PAGAMENTO.map((item) => (
              <SelectItem key={item} value={item}>
                {ROTULO_TIPO_PAGAMENTO[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        colunas={colunas}
        dados={data?.items ?? SEM_DADOS}
        carregando={isLoading}
        paginacao={
          data && {
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            aoMudarPagina: (novaPagina) =>
              navigate({ search: (anterior) => ({ ...anterior, page: novaPagina }) }),
          }
        }
      />
    </>
  )
}
