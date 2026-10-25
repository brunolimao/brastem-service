import { createFileRoute, redirect } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
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
import { useSessionStore } from '@/hooks/use-session-store'
import { useRemoverUsuario, useUsuarios } from '@/hooks/use-usuarios'
import { formatarData } from '@/libs/formatters'
import { ROTULO_ROLE, type Usuario } from '@/models/usuario.model'

export const Route = createFileRoute('/_app/usuarios')({
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: UsuariosPage,
})

function BotaoRemover({ usuario }: { usuario: Usuario }) {
  const remover = useRemoverUsuario()
  const euMesmo = useSessionStore((estado) => estado.usuario?.id === usuario.id)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${usuario.usuario}`}
          disabled={euMesmo}
          title={euMesmo ? 'Você não pode apagar a si mesmo' : undefined}
        >
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
  const { data, isLoading } = useUsuarios()

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao={data ? `${data.length} usuários cadastrados` : undefined}
        acoes={<CriarUsuarioDialog />}
      />
      <DataTable colunas={colunas} dados={data ?? SEM_DADOS} carregando={isLoading} />
    </>
  )
}

// Referência estável: um `[]` novo a cada render invalidaria os modelos da tabela.
const SEM_DADOS: Usuario[] = []
