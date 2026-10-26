import { type ColumnDef, type RowData, tableFeatures, useTable } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
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

// Tabela só de exibição: ordenação e filtro são feitos no servidor. A paginação é sempre mostrada:
// pelo servidor quando a tela passa `paginacao`; senão, a própria tabela pagina os dados que recebeu.
const features = tableFeatures({})

/** Linhas por página quando a tabela pagina sozinha (o mesmo padrão das listas do servidor). */
export const LINHAS_POR_PAGINA = 20

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
  /** Paginação feita pelo servidor. Sem ela, a tabela pagina sozinha os `dados` recebidos. */
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
  const [paginaLocal, setPaginaLocal] = useState(1)
  const pagina: Paginacao = paginacao ?? {
    page: paginaLocal,
    pageSize: LINHAS_POR_PAGINA,
    total: dados.length,
    aoMudarPagina: setPaginaLocal,
  }
  const visiveis = paginacao
    ? dados
    : dados.slice((paginaLocal - 1) * LINHAS_POR_PAGINA, paginaLocal * LINHAS_POR_PAGINA)

  const table = useTable({ features, columns: colunas, data: visiveis })
  const totalPaginas = Math.max(1, Math.ceil(pagina.total / pagina.pageSize))
  const paginaAlemDoFim = !carregando && pagina.page > totalPaginas
  const { aoMudarPagina } = pagina

  // Excluir o último item da última página deixava a tela em "Página 3 de 2", vazia: volta uma.
  useEffect(() => {
    if (paginaAlemDoFim) aoMudarPagina(totalPaginas)
  }, [paginaAlemDoFim, aoMudarPagina, totalPaginas])

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

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          {pagina.total} {pagina.total === 1 ? 'resultado' : 'resultados'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.page <= 1}
            onClick={() => aoMudarPagina(pagina.page - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {pagina.page} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.page >= totalPaginas}
            onClick={() => aoMudarPagina(pagina.page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
