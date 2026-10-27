import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Pencil, Plus } from 'lucide-react'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { BuscaLista } from '@/components/domain/busca-lista'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useClientes, useRemoverCliente } from '@/hooks/use-clientes'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { mascararCpfCnpj } from '@/libs/masks'
import { ordenacaoDaUrl, ordenacaoNaUrl, urlDaOrdenacao } from '@/libs/ordenacao'
import { numeroPositivo, textoDeBusca, umDos } from '@/libs/search-params'
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
      <Button asChild variant="ghost" size="icon" aria-label={`Editar ${cliente.nome}`}>
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

function ClientesPage() {
  const { busca, campo, page, ordem, direcao } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const pageSize = usePreferenciasStore((estado) => estado.linhasPorPagina)
  const { data, isLoading } = useClientes({ busca, campo, page, pageSize, ordem, direcao })

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
      <DataTable
        colunas={colunas}
        dados={data?.items ?? SEM_DADOS}
        carregando={isLoading}
        mensagemVazia={busca ? `Nenhum cliente encontrado para "${busca}"` : 'Nenhum cliente ainda'}
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
        classeDaLinha={(cliente) => (cliente.negativado ? 'text-destructive' : undefined)}
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
    </>
  )
}
