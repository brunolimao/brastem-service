import { type ColumnDef, type RowData, tableFeatures, useTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Tabela só de exibição: ordenação, filtro e paginação são feitos no servidor.
const features = tableFeatures({})

export type Coluna<TData extends RowData> = ColumnDef<typeof features, TData>

export interface Paginacao {
  page: number
  pageSize: number
  total: number
  aoMudarPagina: (page: number) => void
}

interface DataTableProps<TData extends RowData> {
  colunas: Coluna<TData>[]
  dados: TData[]
  carregando?: boolean
  mensagemVazia?: string
  paginacao?: Paginacao
  /** Destaca a linha (ex.: cliente negativado em vermelho). */
  classeDaLinha?: (linha: TData) => string | undefined
}

export function DataTable<TData extends RowData>({
  colunas,
  dados,
  carregando,
  mensagemVazia = 'Nenhum registro encontrado',
  paginacao,
  classeDaLinha,
}: DataTableProps<TData>) {
  const table = useTable({ features, columns: colunas, data: dados })
  const totalPaginas = paginacao ? Math.max(1, Math.ceil(paginacao.total / paginacao.pageSize)) : 1

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((cabecalho) => (
                  <TableHead key={cabecalho.id}>
                    {cabecalho.isPlaceholder ? null : <table.FlexRender header={cabecalho} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {carregando ? (
              Array.from({ length: 5 }, (_, indice) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: linhas de esqueleto são estáticas
                <TableRow key={indice}>
                  <TableCell colSpan={colunas.length}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colunas.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {mensagemVazia}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((linha) => (
                <TableRow key={linha.id} className={classeDaLinha?.(linha.original)}>
                  {linha.getAllCells().map((celula) => (
                    <TableCell key={celula.id}>
                      <table.FlexRender cell={celula} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginacao && (
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
            {paginacao.total} {paginacao.total === 1 ? 'resultado' : 'resultados'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginacao.page <= 1}
              onClick={() => paginacao.aoMudarPagina(paginacao.page - 1)}
            >
              Anterior
            </Button>
            <span>
              Página {paginacao.page} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={paginacao.page >= totalPaginas}
              onClick={() => paginacao.aoMudarPagina(paginacao.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
