import { ListOrdered } from 'lucide-react'
import { useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useParcelas } from '@/hooks/use-financeiro'
import { formatarData, formatarMoeda } from '@/libs/formatters'

/** Botão que abre as parcelas de um pagamento (carrega só quando abre). */
export function ParcelasDialog({ pagamentoId }: { pagamentoId: number }) {
  const [aberto, setAberto] = useState(false)
  const { data, isLoading } = useParcelas(pagamentoId, aberto)

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ver parcelas do pagamento ${pagamentoId}`}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((parcela) => (
                <TableRow key={parcela.id}>
                  <TableCell>{parcela.numero === 0 ? 'À vista' : parcela.numero}</TableCell>
                  <TableCell>{formatarData(parcela.data)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(parcela.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
