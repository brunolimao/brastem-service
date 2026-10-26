import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Pencil, Printer, X } from 'lucide-react'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { BuscaLista } from '@/components/domain/busca-lista'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOrdensServico, useRemoverOrdemServico } from '@/hooks/use-ordens-servico'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { numeroPositivo, textoDeBusca, umDos } from '@/libs/search-params'
import {
  CAMPOS_BUSCA_OS,
  type OrdemServicoListada,
  ROTULO_STATUS,
} from '@/models/ordem-servico.model'

export const Route = createFileRoute('/_app/ordens-servico/')({
  validateSearch: z.object({
    busca: textoDeBusca,
    campo: umDos(CAMPOS_BUSCA_OS),
    page: numeroPositivo,
    clienteId: z.number().int().optional().catch(undefined),
    aparelhoId: z.number().int().optional().catch(undefined),
  }),
  component: OrdensServicoPage,
})

function AcoesDaOrdem({ ordem }: { ordem: OrdemServicoListada }) {
  const remover = useRemoverOrdemServico()
  const admin = useSessionStore((estado) => estado.usuario?.role === 'admin')
  const params = { ordemId: String(ordem.id) }

  return (
    <div className="flex items-center justify-end">
      <Button asChild variant="ghost" size="icon" aria-label={`Imprimir OS ${ordem.id}`}>
        <Link to="/ordens-servico/$ordemId/imprimir" params={params}>
          <Printer />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label={`Editar OS ${ordem.id}`}>
        <Link to="/ordens-servico/$ordemId" params={params}>
          <Pencil />
        </Link>
      </Button>
      {admin && (
        <BotaoExcluir
          titulo={`Excluir a OS ${ordem.id}?`}
          descricao="Os pagamentos e as parcelas dessa ordem de serviço também serão apagados. Isso não pode ser desfeito."
          aoConfirmar={() => remover.mutate(ordem.id)}
        />
      )}
    </div>
  )
}

const colunas: Coluna<OrdemServicoListada>[] = [
  { accessorKey: 'id', header: 'Código' },
  {
    accessorKey: 'abertura',
    header: 'Abertura',
    cell: ({ row }) => formatarData(row.original.abertura),
  },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => formatarMoeda(row.original.valor + row.original.taxaDeslocamento),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'FECHADO' ? 'default' : 'secondary'}>
        {ROTULO_STATUS[row.original.status]}
      </Badge>
    ),
  },
  { accessorKey: 'solucionado', header: 'Problema solucionado' },
  {
    accessorKey: 'clienteNome',
    header: 'Cliente',
    cell: ({ row }) => (
      <Link
        to="/clientes/$clienteId"
        params={{ clienteId: String(row.original.clienteId) }}
        className="hover:underline"
      >
        {row.original.clienteNome}
      </Link>
    ),
  },
  { accessorKey: 'aparelhoNome', header: 'Aparelho' },
  { id: 'acoes', header: '', cell: ({ row }) => <AcoesDaOrdem ordem={row.original} /> },
]

const SEM_DADOS: OrdemServicoListada[] = []

function OrdensServicoPage() {
  const { busca, campo, page, clienteId, aparelhoId } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isLoading } = useOrdensServico({ busca, campo, page, clienteId, aparelhoId })
  const filtrada = clienteId !== undefined || aparelhoId !== undefined

  return (
    <>
      <PageHeader
        titulo="Ordens de serviço"
        descricao={
          filtrada ? 'Mostrando só as ordens do cliente ou aparelho escolhido.' : undefined
        }
        acoes={
          filtrada && (
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  search: { clienteId: undefined, aparelhoId: undefined, page: undefined },
                })
              }
            >
              <X /> Ver todas
            </Button>
          )
        }
      />
      <BuscaLista
        campos={CAMPOS_BUSCA_OS}
        campo={campo}
        busca={busca}
        placeholder="Código, data (2026-10), valor, status..."
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
      <DataTable
        colunas={colunas}
        dados={data?.items ?? SEM_DADOS}
        carregando={isLoading}
        classeDaLinha={(ordem) => (ordem.clienteNegativado ? 'text-destructive' : undefined)}
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
