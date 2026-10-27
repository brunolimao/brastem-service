import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { PrintOS } from '@/components/domain/print-os'
import { PrintOSAntigo } from '@/components/domain/print-os-antigo'
import { SeletorModeloImpressao } from '@/components/domain/seletor-modelo-impressao'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEmpresa } from '@/hooks/use-empresa'
import { useOrdemServico } from '@/hooks/use-ordens-servico'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { empresaVazia } from '@/models/empresa.model'

export const Route = createFileRoute('/_app/ordens-servico/$ordemId/imprimir')({
  component: ImprimirOrdemServicoPage,
})

function ImprimirOrdemServicoPage() {
  const ordemId = Number(Route.useParams().ordemId)
  const { data, isLoading } = useOrdemServico(ordemId)
  const { data: empresa } = useEmpresa()
  const modelo = usePreferenciasStore((estado) => estado.modeloDeImpressao)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!data) return <p>Ordem de serviço não encontrada.</p>

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="outline">
          <Link to="/ordens-servico/$ordemId" params={{ ordemId: String(ordemId) }}>
            <ArrowLeft /> Voltar
          </Link>
        </Button>
        <SeletorModeloImpressao />
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </div>
      {modelo === 'antigo' ? (
        <PrintOSAntigo detalhe={data} empresa={empresa ?? empresaVazia} />
      ) : (
        <PrintOS detalhe={data} empresa={empresa ?? empresaVazia} />
      )}
    </>
  )
}
