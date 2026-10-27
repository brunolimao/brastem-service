import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { CriarUsuarioDialog } from '@/components/domain/criar-usuario-dialog'
import { PageHeader } from '@/components/layout/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dica } from '@/components/ui/tooltip'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useRemoverUsuario, useUsuarios } from '@/hooks/use-usuarios'
import { formatarData } from '@/libs/formatters'
import { ordenacaoDaUrl, ordenacaoNaUrl, urlDaOrdenacao } from '@/libs/ordenacao'
import { numeroPositivo } from '@/libs/search-params'
import { ORDENAVEIS_USUARIO, ROTULO_ROLE, type Usuario } from '@/models/usuario.model'

export const Route = createFileRoute('/_app/usuarios')({
  validateSearch: z.object({ page: numeroPositivo, ...ordenacaoNaUrl(ORDENAVEIS_USUARIO) }),
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: UsuariosPage,
})

function BotaoRemover({ usuario }: { usuario: Usuario }) {
  const remover = useRemoverUsuario()
  const euMesmo = useSessionStore((estado) => estado.usuario?.id === usuario.id)

  if (euMesmo) {
    // Botão desabilitado não recebe o mouse: a dica que explica o porquê fica num invólucro focável.
    return (
      <Dica texto="Você não pode apagar a si mesmo">
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: foco para ler a dica do botão desabilitado */}
        <span tabIndex={0} className="inline-flex">
          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${usuario.usuario}`} disabled>
            <Trash2 className="text-destructive" />
          </Button>
        </span>
      </Dica>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${usuario.usuario}`}>
          <Trash2 className="text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {usuario.usuario}?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa pessoa não poderá mais entrar no sistema. Isso não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => remover.mutate(usuario.id)}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const colunas: Coluna<Usuario>[] = [
  { accessorKey: 'id', header: 'Código' },
  { accessorKey: 'usuario', header: 'Usuário' },
  {
    accessorKey: 'role',
    header: 'Função',
    cell: ({ row }) => (
      <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>
        {ROTULO_ROLE[row.original.role]}
      </Badge>
    ),
  },
  {
    accessorKey: 'criadoEm',
    header: 'Cadastro',
    cell: ({ row }) => formatarData(row.original.criadoEm),
  },
  { id: 'acoes', header: '', cell: ({ row }) => <BotaoRemover usuario={row.original} /> },
]

function UsuariosPage() {
  const { page, ordem, direcao } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const pageSize = usePreferenciasStore((estado) => estado.linhasPorPagina)
  const { data, isLoading } = useUsuarios({ page, pageSize, ordem, direcao })

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao={data ? `${data.total} usuários cadastrados` : undefined}
        acoes={<CriarUsuarioDialog />}
      />
      <DataTable
        colunas={colunas}
        dados={data?.items ?? SEM_DADOS}
        carregando={isLoading}
        ordenaveis={ORDENAVEIS_USUARIO}
        ordenacao={ordenacaoDaUrl({ ordem, direcao })}
        aoOrdenar={(nova) =>
          navigate({
            search: (anterior) => ({ ...anterior, ...urlDaOrdenacao(nova, ORDENAVEIS_USUARIO) }),
          })
        }
        paginacao={{
          page: page ?? 1,
          pageSize,
          total: data?.total ?? 0,
          aoMudarPagina: (novaPagina) =>
            navigate({ search: (anterior) => ({ ...anterior, page: novaPagina }) }),
        }}
      />
    </>
  )
}

// Referência estável: um `[]` novo a cada render invalidaria os modelos da tabela.
const SEM_DADOS: Usuario[] = []
