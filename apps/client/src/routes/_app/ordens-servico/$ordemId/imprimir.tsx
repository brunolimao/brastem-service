import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { PrintOS } from '@/components/domain/print-os'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrdemServico } from '@/hooks/use-ordens-servico'

export const Route = createFileRoute('/_app/ordens-servico/$ordemId/imprimir')({
  component: ImprimirOrdemServicoPage,
})

function ImprimirOrdemServicoPage() {
  const ordemId = Number(Route.useParams().ordemId)
  const { data, isLoading } = useOrdemServico(ordemId)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!data) return <p>Ordem de serviço não encontrada.</p>

  return (
    <>
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link to="/ordens-servico/$ordemId" params={{ ordemId: String(ordemId) }}>
            <ArrowLeft /> Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </div>
      <PrintOS detalhe={data} />
    </>
  )
}
