import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ListChecks } from 'lucide-react'
import { ClienteFormulario } from '@/components/domain/cliente-form'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtualizarCliente, useCliente } from '@/hooks/use-clientes'
import { formatarData } from '@/libs/formatters'
import { clienteParaForm, formParaPayloadCliente } from '@/models/cliente.model'

export const Route = createFileRoute('/_app/clientes/$clienteId')({ component: EditarClientePage })

function EditarClientePage() {
  const clienteId = Number(Route.useParams().clienteId)
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(clienteId)
  const atualizar = useAtualizarCliente(clienteId)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!cliente) return <PageHeader titulo="Cliente não encontrado" />

  return (
    <>
      <PageHeader
        titulo={cliente.nome}
        descricao={`Código ${cliente.id} · cadastrado em ${formatarData(cliente.criadoEm)}`}
        acoes={
          <Button asChild variant="outline">
            <Link to="/ordens-servico" search={{ clienteId }}>
              <ListChecks /> Ver todas as OS
            </Link>
          </Button>
        }
      />
      {/* A `key` refaz o formulário quando o cliente é recarregado depois de salvar. */}
      <ClienteFormulario
        key={`${cliente.id}-${cliente.telefones.length}-${cliente.aparelhos.map((a) => a.id).join(',')}`}
        valoresIniciais={clienteParaForm(cliente)}
        clienteId={cliente.id}
        aoCancelar={() => navigate({ to: '/clientes' })}
        aoSalvar={(valores) => atualizar.mutateAsync(formParaPayloadCliente(valores))}
      />
    </>
  )
}
