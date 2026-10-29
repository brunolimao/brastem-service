import { STATUS_OS, type StatusOS } from '@brastem/shared'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Pencil, Printer, X } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { BuscaLista } from '@/components/domain/busca-lista'
import { EtiquetaStatus } from '@/components/domain/etiqueta-status'
import { AbasDeStatus, OrdensEmCartoes, PainelDaOrdem } from '@/components/domain/modelos-telas'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useOrdensServico, useRemoverOrdemServico } from '@/hooks/use-ordens-servico'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { ordenacaoDaUrl, ordenacaoNaUrl, urlDaOrdenacao } from '@/libs/ordenacao'
import { numeroPositivo, textoDeBusca, umDos } from '@/libs/search-params'
import { cn } from '@/libs/utils'
import {
  CAMPOS_BUSCA_OS,
  ORDENAVEIS_OS,
  type OrdemServicoListada,
} from '@/models/ordem-servico.model'

export const Route = createFileRoute('/_app/ordens-servico/')({
  validateSearch: z.object({
    busca: textoDeBusca,
    campo: umDos(CAMPOS_BUSCA_OS),
    page: numeroPositivo,
    clienteId: z.number().int().optional().catch(undefined),
    aparelhoId: z.number().int().optional().catch(undefined),
    ...ordenacaoNaUrl(ORDENAVEIS_OS),
  }),
  component: OrdensServicoPage,
})

function AcoesDaOrdem({ ordem }: { ordem: OrdemServicoListada }) {
  const remover = useRemoverOrdemServico()
  const admin = useSessionStore((estado) => estado.usuario?.role === 'admin')
  const params = { ordemId: String(ordem.id) }

  return (
    <div className="flex items-center justify-end">
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Imprimir OS ${ordem.id}`}>
        <Link to="/ordens-servico/$ordemId/imprimir" params={params}>
          <Printer />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Editar OS ${ordem.id}`}>
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
    cell: ({ row }) => <EtiquetaStatus status={row.original.status} />,
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

/** D · Planilha (em teste): o código escolhe a OS, que aparece ao lado da lista. */
const colunasComEscolha = (escolher: (id: number) => void): Coluna<OrdemServicoListada>[] => [
  {
    accessorKey: 'id',
    header: 'Código',
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => escolher(row.original.id)}
        className="font-semibold text-primary hover:underline"
        aria-label={`Ver a OS ${row.original.id} ao lado`}
      >
        {row.original.id}
      </button>
    ),
  },
  ...colunas.slice(1),
]

function OrdensServicoPage() {
  const { busca, campo, page, clienteId, aparelhoId, ordem, direcao } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const pageSize = usePreferenciasStore((estado) => estado.linhasPorPagina)
  const { data, isLoading } = useOrdensServico({
    busca,
    campo,
    page,
    pageSize,
    ordem,
    direcao,
    clienteId,
    aparelhoId,
  })
  const filtrada = clienteId !== undefined || aparelhoId !== undefined
  const modelo = useThemeStore((estado) => estado.modelo)
  const [escolhida, setEscolhida] = useState<number>()
  const statusDaBusca =
    campo === 'status' ? STATUS_OS.find((status) => status === busca?.toUpperCase()) : undefined
  const filtrarStatus = (status: StatusOS | undefined) =>
    navigate({
      search: (anterior) => ({
        ...anterior,
        campo: status ? 'status' : undefined,
        busca: status,
        page: undefined,
      }),
    })
  const paginacao = data && {
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    aoMudarPagina: (novaPagina: number) =>
      navigate({ search: (anterior) => ({ ...anterior, page: novaPagina }) }),
  }
  const vazia = busca ? (
    <Button
      variant="outline"
      onClick={() =>
        navigate({
          search: (anterior) => ({ ...anterior, busca: undefined, campo: undefined }),
        })
      }
    >
      Limpar busca
    </Button>
  ) : (
    <p className="text-sm">
      Para gerar uma OS, abra a ficha do cliente e clique em "Gerar OS" no aparelho.{' '}
      <Link to="/clientes" className="text-primary underline-offset-4 hover:underline">
        Ir para os clientes
      </Link>
    </p>
  )

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
      {modelo === 'cartoes' ? (
        <>
          <AbasDeStatus atual={statusDaBusca} aoEscolher={filtrarStatus} />
          <OrdensEmCartoes
            ordens={data?.items ?? SEM_DADOS}
            carregando={isLoading}
            vazia={
              <>
                <span>
                  {busca
                    ? `Nenhuma ordem de serviço encontrada para "${busca}"`
                    : 'Nenhuma ordem de serviço'}
                </span>
                {vazia}
              </>
            }
          />
          {paginacao && paginacao.total > paginacao.pageSize && (
            <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm">
              <Button
                variant="outline"
                disabled={paginacao.page <= 1}
                onClick={() => paginacao.aoMudarPagina(paginacao.page - 1)}
              >
                Anterior
              </Button>
              Página {paginacao.page} de {Math.ceil(paginacao.total / paginacao.pageSize)}
              <Button
                variant="outline"
                disabled={paginacao.page * paginacao.pageSize >= paginacao.total}
                onClick={() => paginacao.aoMudarPagina(paginacao.page + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            'grid min-w-0 grid-cols-1 gap-4',
            modelo === 'planilha' && 'xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]',
          )}
        >
          <DataTable
            colunas={modelo === 'planilha' ? colunasComEscolha(setEscolhida) : colunas}
            dados={data?.items ?? SEM_DADOS}
            carregando={isLoading}
            mensagemVazia={
              busca
                ? `Nenhuma ordem de serviço encontrada para "${busca}"`
                : 'Nenhuma ordem de serviço'
            }
            acaoVazia={vazia}
            classeDaLinha={(linha) =>
              cn(
                linha.clienteNegativado && 'text-destructive',
                modelo === 'planilha' && linha.id === escolhida && 'bg-accent',
              ) || undefined
            }
            ordenaveis={ORDENAVEIS_OS}
            ordenacao={ordenacaoDaUrl({ ordem, direcao })}
            aoOrdenar={(nova) =>
              navigate({
                search: (anterior) => ({ ...anterior, ...urlDaOrdenacao(nova, ORDENAVEIS_OS) }),
              })
            }
            paginacao={paginacao}
          />
          {modelo === 'planilha' && <PainelDaOrdem ordemId={escolhida} />}
        </div>
      )}
    </>
  )
}
