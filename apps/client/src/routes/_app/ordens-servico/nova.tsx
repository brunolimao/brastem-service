import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { OrdemServicoFormulario } from '@/components/domain/ordem-servico-form'
import { ResumoOrdem } from '@/components/domain/resumo-ordem'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCliente } from '@/hooks/use-clientes'
import { useCriarOrdemServico } from '@/hooks/use-ordens-servico'
import { formParaPayloadOrdemServico, ordemServicoVazia } from '@/models/ordem-servico.model'

export const Route = createFileRoute('/_app/ordens-servico/nova')({
  validateSearch: z.object({
    clienteId: z.number().int().optional().catch(undefined),
    aparelhoId: z.number().int().optional().catch(undefined),
  }),
  component: NovaOrdemServicoPage,
})

function NovaOrdemServicoPage() {
  const { clienteId, aparelhoId } = Route.useSearch()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(clienteId)
  const criar = useCriarOrdemServico()
  const aparelho = cliente?.aparelhos.find((item) => item.id === aparelhoId)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!cliente || !aparelho || clienteId === undefined || aparelhoId === undefined) {
    return (
      <>
        <PageHeader
          titulo="Gerar ordem de serviço"
          descricao="Escolha o aparelho na tela do cliente para gerar a OS."
        />
        <Button asChild className="w-fit">
          <Link to="/clientes">Ir para os clientes</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <PageHeader titulo="Gerar ordem de serviço" />
      <ResumoOrdem cliente={cliente} aparelho={aparelho} telefones={cliente.telefones} />
      <OrdemServicoFormulario
        valoresIniciais={ordemServicoVazia()}
        aoCancelar={() => navigate({ to: '/ordens-servico', search: { aparelhoId } })}
        aoSalvar={async (valores) => {
          await criar.mutateAsync({
            ...formParaPayloadOrdemServico(valores),
            clienteId,
            aparelhoId,
          })
          await navigate({ to: '/ordens-servico', search: { aparelhoId } })
        }}
      />
    </>
  )
}
