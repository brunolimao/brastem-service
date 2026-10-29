import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { OrdemServicoFormulario } from '@/components/domain/ordem-servico-form'
import { ResumoOrdem } from '@/components/domain/resumo-ordem'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCliente } from '@/hooks/use-clientes'
import { useCriarOrdemServico } from '@/hooks/use-ordens-servico'
import { useThemeStore } from '@/hooks/use-theme-store'
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
  const modelo = useThemeStore((estado) => estado.modelo)

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

  const resumo = <ResumoOrdem cliente={cliente} aparelho={aparelho} telefones={cliente.telefones} />
  const formulario = (
    <OrdemServicoFormulario
      valoresIniciais={ordemServicoVazia()}
      passoAPasso={modelo === 'cartoes'}
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
  )

  // D · Planilha (em teste): formulário à esquerda e quem é o cliente e o aparelho fixos à direita.
  if (modelo === 'planilha') {
    return (
      <>
        <PageHeader titulo="Gerar ordem de serviço" />
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {formulario}
          <aside aria-label="Cliente e aparelho" className="xl:sticky xl:top-0">
            {resumo}
          </aside>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        titulo={modelo === 'cartoes' ? 'Nova ordem de serviço' : 'Gerar ordem de serviço'}
      />
      {resumo}
      {formulario}
    </>
  )
}
