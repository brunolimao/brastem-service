import { type ColumnDef, type RowData, tableFeatures, useTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type LinhasPorPagina,
  OPCOES_LINHAS_POR_PAGINA,
  usePreferenciasStore,
} from '@/hooks/use-preferencias-store'
import { type Ordenacao, ordenarLinhas, proximaOrdenacao } from '@/libs/ordenacao'

// A tabela em si só exibe. Ordenação e paginação são do servidor quando a tela passa `paginacao`
// (listas grandes); senão, a própria tabela ordena e pagina os dados que recebeu.
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
  /** Próximo passo sugerido quando a lista está vazia (ex.: botão "Cadastrar cliente"). */
  acaoVazia?: ReactNode
  /** Paginação feita pelo servidor. Sem ela, a tabela pagina sozinha os `dados` recebidos. */
  paginacao?: Paginacao
  /**
   * Ordenação feita pelo servidor (vem da URL). Só as colunas em `ordenaveis` ficam clicáveis. Sem
   * `aoOrdenar`, a tabela ordena sozinha, por qualquer coluna com `accessorKey`.
   */
  ordenacao?: Ordenacao
  aoOrdenar?: (ordenacao: Ordenacao | undefined) => void
  ordenaveis?: readonly string[]
  /** Destaca a linha (ex.: cliente negativado em vermelho). */
  classeDaLinha?: (linha: TData) => string | undefined
}

/** A chave do dado que a coluna mostra (só colunas com `accessorKey` podem ser ordenadas). */
const chaveDaColuna = <TData extends RowData>(coluna: Coluna<TData>) => {
  const chave = (coluna as { accessorKey?: unknown }).accessorKey
  return typeof chave === 'string' ? chave : undefined
}

const ROTULO_DIRECAO = { asc: 'crescente', desc: 'decrescente' } as const

export function DataTable<TData extends RowData>({
  colunas,
  dados,
  carregando,
  mensagemVazia = 'Nenhum registro encontrado',
  acaoVazia,
  paginacao,
  ordenacao: ordenacaoDoServidor,
  aoOrdenar,
  ordenaveis,
  classeDaLinha,
}: DataTableProps<TData>) {
  const { linhasPorPagina, definirLinhasPorPagina } = usePreferenciasStore()
  const [paginaLocal, setPaginaLocal] = useState(1)
  const [ordenacaoLocal, setOrdenacaoLocal] = useState<Ordenacao>()

  const ordenaNoServidor = aoOrdenar !== undefined
  const ordenacao = ordenaNoServidor ? ordenacaoDoServidor : ordenacaoLocal
  const ordenar = (nova: Ordenacao | undefined) => {
    if (ordenaNoServidor) aoOrdenar(nova)
    else {
      setOrdenacaoLocal(nova)
      setPaginaLocal(1)
    }
  }
  const podeOrdenar = (chave: string | undefined) =>
    chave !== undefined && (!ordenaNoServidor || (ordenaveis ?? []).includes(chave))

  const pagina: Paginacao = paginacao ?? {
    page: paginaLocal,
    pageSize: linhasPorPagina,
    total: dados.length,
    aoMudarPagina: setPaginaLocal,
  }
  const visiveis = paginacao
    ? dados
    : ordenarLinhas(dados, ordenacao).slice(
        (paginaLocal - 1) * linhasPorPagina,
        paginaLocal * linhasPorPagina,
      )

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
                {grupo.headers.map((cabecalho, indice) => {
                  const chave = chaveDaColuna(colunas[indice] as Coluna<TData>)
                  const ativa = chave !== undefined && ordenacao?.coluna === chave
                  const conteudo = cabecalho.isPlaceholder ? null : (
                    <table.FlexRender header={cabecalho} />
                  )
                  if (!podeOrdenar(chave) || chave === undefined) {
                    return <TableHead key={cabecalho.id}>{conteudo}</TableHead>
                  }
                  const Seta = !ativa
                    ? ArrowUpDown
                    : ordenacao?.direcao === 'asc'
                      ? ArrowUp
                      : ArrowDown
                  return (
                    <TableHead
                      key={cabecalho.id}
                      aria-sort={
                        ativa ? (ordenacao?.direcao === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                    >
                      <button
                        type="button"
                        className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground"
                        title={
                          ativa && ordenacao
                            ? `Ordenado em ordem ${ROTULO_DIRECAO[ordenacao.direcao]}`
                            : 'Ordenar por esta coluna'
                        }
                        onClick={() => ordenar(proximaOrdenacao(ordenacao, chave))}
                      >
                        {conteudo}
                        <Seta className={ativa ? 'size-3.5' : 'size-3.5 opacity-40'} />
                      </button>
                    </TableHead>
                  )
                })}
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
                  <div className="grid justify-items-center gap-3">
                    <span>{mensagemVazia}</span>
                    {acaoVazia}
                  </div>
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-sm">
        <span>
          {pagina.total} {pagina.total === 1 ? 'resultado' : 'resultados'}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span>Linhas por página</span>
          <Select
            value={String(linhasPorPagina)}
            onValueChange={(valor) => {
              definirLinhasPorPagina(Number(valor) as LinhasPorPagina)
              aoMudarPagina(1)
            }}
          >
            <SelectTrigger size="sm" className="w-20" aria-label="Linhas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPCOES_LINHAS_POR_PAGINA.map((opcao) => (
                <SelectItem key={opcao} value={String(opcao)}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
