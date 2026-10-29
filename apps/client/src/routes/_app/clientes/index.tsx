import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { BuscaLista } from '@/components/domain/busca-lista'
import { PainelDoCliente } from '@/components/domain/modelos-telas'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useClientes, useRemoverCliente } from '@/hooks/use-clientes'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { mascararCpfCnpj } from '@/libs/masks'
import { ordenacaoDaUrl, ordenacaoNaUrl, urlDaOrdenacao } from '@/libs/ordenacao'
import { numeroPositivo, textoDeBusca, umDos } from '@/libs/search-params'
import { cn } from '@/libs/utils'
import {
  CAMPOS_BUSCA_CLIENTE,
  type ClienteListado,
  ORDENAVEIS_CLIENTE,
} from '@/models/cliente.model'

export const Route = createFileRoute('/_app/clientes/')({
  validateSearch: z.object({
    busca: textoDeBusca,
    campo: umDos(CAMPOS_BUSCA_CLIENTE),
    page: numeroPositivo,
    ...ordenacaoNaUrl(ORDENAVEIS_CLIENTE),
  }),
  component: ClientesPage,
})

function AcoesDoCliente({ cliente }: { cliente: ClienteListado }) {
  const remover = useRemoverCliente()
  const admin = useSessionStore((estado) => estado.usuario?.role === 'admin')

  return (
    <div className="flex items-center justify-end">
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Editar ${cliente.nome}`}>
        <Link to="/clientes/$clienteId" params={{ clienteId: String(cliente.id) }}>
          <Pencil />
        </Link>
      </Button>
      {admin && (
        <BotaoExcluir
          titulo={`Excluir ${cliente.nome}?`}
          descricao="Os aparelhos, as ordens de serviço e os pagamentos desse cliente também serão apagados. Isso não pode ser desfeito."
          aoConfirmar={() => remover.mutate(cliente.id)}
        />
      )}
    </div>
  )
}

const colunas: Coluna<ClienteListado>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'email', header: 'E-mail' },
  {
    accessorKey: 'cpf',
    header: 'CPF/CNPJ',
    cell: ({ row }) => mascararCpfCnpj(row.original.cpf),
  },
  { id: 'acoes', header: '', cell: ({ row }) => <AcoesDoCliente cliente={row.original} /> },
]

const SEM_DADOS: ClienteListado[] = []

/** D · Planilha (em teste): o nome escolhe o cliente, cuja ficha aparece ao lado da lista. */
const colunasComEscolha = (escolher: (id: number) => void): Coluna<ClienteListado>[] =>
  colunas.map((coluna) =>
    'accessorKey' in coluna && coluna.accessorKey === 'nome'
      ? {
          accessorKey: 'nome',
          header: 'Nome',
          cell: ({ row }) => (
            <button
              type="button"
              onClick={() => escolher(row.original.id)}
              className="text-left font-semibold hover:underline"
              aria-label={`Ver a ficha de ${row.original.nome} ao lado`}
            >
              {row.original.nome}
            </button>
          ),
        }
      : coluna,
  )

function ClientesPage() {
  const { busca, campo, page, ordem, direcao } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const pageSize = usePreferenciasStore((estado) => estado.linhasPorPagina)
  const { data, isLoading } = useClientes({ busca, campo, page, pageSize, ordem, direcao })
  const planilha = useThemeStore((estado) => estado.modelo) === 'planilha'
  const [escolhido, setEscolhido] = useState<number>()

  return (
    <>
      <PageHeader
        titulo="Clientes"
        acoes={
          <Button asChild>
            <Link to="/clientes/novo">
              <Plus /> Cadastrar cliente
            </Link>
          </Button>
        }
      />
      <BuscaLista
        campos={CAMPOS_BUSCA_CLIENTE}
        campo={campo}
        busca={busca}
        placeholder="Nome, CPF, telefone..."
        aoBuscar={(novo) =>
          navigate({
            search: { busca: novo.busca || undefined, campo: novo.campo, page: undefined },
          })
        }
      />
      <div
        className={cn(
          'grid min-w-0 grid-cols-1 gap-4',
          planilha && 'xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]',
        )}
      >
        <DataTable
          colunas={planilha ? colunasComEscolha(setEscolhido) : colunas}
          dados={data?.items ?? SEM_DADOS}
          carregando={isLoading}
          mensagemVazia={
            busca ? `Nenhum cliente encontrado para "${busca}"` : 'Nenhum cliente ainda'
          }
          acaoVazia={
            busca ? (
              <Button
                variant="outline"
                onClick={() => navigate({ search: { busca: undefined, campo: undefined } })}
              >
                Limpar busca
              </Button>
            ) : (
              <Button asChild>
                <Link to="/clientes/novo">
                  <Plus /> Cadastrar cliente
                </Link>
              </Button>
            )
          }
          classeDaLinha={(cliente) =>
            cn(
              cliente.negativado && 'text-destructive',
              planilha && cliente.id === escolhido && 'bg-accent',
            ) || undefined
          }
          ordenaveis={ORDENAVEIS_CLIENTE}
          ordenacao={ordenacaoDaUrl({ ordem, direcao })}
          aoOrdenar={(nova) =>
            navigate({
              search: (anterior) => ({ ...anterior, ...urlDaOrdenacao(nova, ORDENAVEIS_CLIENTE) }),
            })
          }
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
        {planilha && <PainelDoCliente clienteId={escolhido} />}
      </div>
    </>
  )
}
