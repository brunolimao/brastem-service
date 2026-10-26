import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { OrdemServicoFormulario } from '@/components/domain/ordem-servico-form'
import { ResumoOrdem } from '@/components/domain/resumo-ordem'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtualizarOrdemServico, useOrdemServico } from '@/hooks/use-ordens-servico'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { formParaPayloadOrdemServico, ordemServicoParaForm } from '@/models/ordem-servico.model'

export const Route = createFileRoute('/_app/ordens-servico/$ordemId/')({
  component: EditarOrdemServicoPage,
})

function EditarOrdemServicoPage() {
  const ordemId = Number(Route.useParams().ordemId)
  const navigate = useNavigate()
  const { data, isLoading } = useOrdemServico(ordemId)
  const atualizar = useAtualizarOrdemServico(ordemId)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!data) return <PageHeader titulo="Ordem de serviço não encontrada" />

  const voltar = () => navigate({ to: '/ordens-servico', search: { aparelhoId: data.aparelho.id } })

  return (
    <>
      <PageHeader titulo={`Ordem de serviço ${data.ordemServico.id}`} />
      <ResumoOrdem cliente={data.cliente} aparelho={data.aparelho} telefones={data.telefones} />
      {/* A `key` refaz o formulário com os dados novos depois de salvar. */}
      <OrdemServicoFormulario
        key={`${data.ordemServico.id}-${data.pagamentos.map((p) => p.id).join(',')}`}
        valoresIniciais={ordemServicoParaForm(data)}
        aoCancelar={voltar}
        aoSalvar={(valores) => atualizar.mutateAsync(formParaPayloadOrdemServico(valores))}
        aoConcluir={voltar}
        aoImprimir={() =>
          navigate({
            to: '/ordens-servico/$ordemId/imprimir',
            params: { ordemId: String(ordemId) },
          })
        }
      />

      {data.ultimasOrdens.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos serviços neste aparelho</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {data.ultimasOrdens
              .filter((ordem) => ordem.id !== ordemId)
              .map((ordem) => (
                <Link
                  key={ordem.id}
                  to="/ordens-servico/$ordemId"
                  params={{ ordemId: String(ordem.id) }}
                  className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2 hover:bg-muted"
                >
                  <span>
                    OS {ordem.id} · {formatarData(ordem.abertura)}
                  </span>
                  <span className="text-muted-foreground">
                    {ordem.solucionado || 'Sem solução registrada'}
                  </span>
                  <span>{formatarMoeda(ordem.valor + ordem.taxaDeslocamento)}</span>
                </Link>
              ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}
