import { ListOrdered } from 'lucide-react'
import { useState } from 'react'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useParcelas } from '@/hooks/use-financeiro'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import type { ParcelaApi } from '@/models/pagamento.model'

const colunas: Coluna<ParcelaApi>[] = [
  {
    id: 'numero',
    header: 'Parcela',
    cell: ({ row }) => (row.original.numero === 0 ? 'À vista' : row.original.numero),
  },
  { id: 'data', header: 'Data', cell: ({ row }) => formatarData(row.original.data) },
  { id: 'valor', header: 'Valor', cell: ({ row }) => formatarMoeda(row.original.valor) },
]

/** Botão que abre as parcelas de um pagamento (carrega só quando abre). */
export function ParcelasDialog({ pagamentoId }: { pagamentoId: number }) {
  const [aberto, setAberto] = useState(false)
  const { data, isLoading } = useParcelas(pagamentoId, aberto)

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ver parcelas do pagamento ${pagamentoId}`}
        >
          <ListOrdered />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parcelas do pagamento {pagamentoId}</DialogTitle>
          <DialogDescription>Cada parcela entra no caixa na data indicada.</DialogDescription>
        </DialogHeader>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <DataTable colunas={colunas} dados={data} mensagemVazia="Nenhuma parcela" />
        )}
      </DialogContent>
    </Dialog>
  )
}
