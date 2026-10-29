import type { StatusOS } from '@brastem/shared'
import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ClipboardList,
  type LucideIcon,
  Search,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { AvisoBackup } from '@/components/domain/aviso-backup'
import { EtiquetaStatus } from '@/components/domain/etiqueta-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBuscaRapidaStore } from '@/hooks/use-busca-rapida'
import { useOrdensServico } from '@/hooks/use-ordens-servico'
import { usePainel } from '@/hooks/use-painel'
import { type Recente, useRecentes } from '@/hooks/use-recentes'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { cn } from '@/libs/utils'
import { ROTULO_STATUS } from '@/models/ordem-servico.model'
import { type Painel, STATUS_EM_ANDAMENTO } from '@/models/painel.model'

/*
 * Início dos modelos de tela em teste (B a E; o A é o Início de sempre, em routes/_app/index.tsx). Os
 * dados são os mesmos do Início atual (GET /api/painel, fichas recentes, lista de OS por status); muda
 * só o jeito de mostrar.
 */

interface Atalho {
  to: string
  rotulo: string
  detalhe: string
  icone: LucideIcon
}

const ATALHOS: Atalho[] = [
  {
    to: '/clientes/novo',
    rotulo: 'Cadastrar cliente',
    detalhe: 'E já gerar a OS',
    icone: UserPlus,
  },
  {
    to: '/ordens-servico',
    rotulo: 'Ordens de serviço',
    detalhe: 'Buscar e abrir',
    icone: ClipboardList,
  },
  {
    to: '/caixa/receita',
    rotulo: 'Lançar receita',
    detalhe: 'Entrada no caixa',
    icone: TrendingUp,
  },
  {
    to: '/caixa/despesa',
    rotulo: 'Lançar despesa',
    detalhe: 'Saída do caixa',
    icone: TrendingDown,
  },
]

const plural = (quantidade: number, um: string, varios: string) =>
  `${quantidade} ${quantidade === 1 ? um : varios}`

const dias = (quantidade: number) => (quantidade === 0 ? 'hoje' : plural(quantidade, 'dia', 'dias'))

const diaPorExtenso = (hoje: string | undefined) =>
  hoje ? format(parseISO(hoje), "EEEE, d 'de' MMMM", { locale: ptBR }) : ''

/** Os números do Início atual, em pares título/valor, na ordem de sempre. */
function numerosDoPainel(painel: Painel) {
  const { emAndamento } = painel.ordens
  const total = STATUS_EM_ANDAMENTO.reduce((soma, status) => soma + emAndamento[status], 0)
  const numeros = [
    { titulo: 'OS em andamento', valor: String(total) },
    { titulo: 'Abertas hoje', valor: String(painel.ordens.abertasHoje) },
    { titulo: 'Fechadas no mês', valor: String(painel.ordens.fechadasNoMes) },
    { titulo: 'Clientes novos no mês', valor: String(painel.clientesNovosNoMes) },
  ]
  if (painel.financeiro) {
    numeros.push(
      { titulo: 'Faturamento do mês', valor: formatarMoeda(painel.financeiro.faturamentoMes) },
      { titulo: 'Caixa do mês', valor: formatarMoeda(painel.financeiro.caixaMes) },
    )
  }
  return numeros
}

const linkDoRecente = (recente: Recente) =>
  recente.tipo === 'cliente'
    ? ({ to: '/clientes/$clienteId', params: { clienteId: String(recente.id) } } as const)
    : ({ to: '/ordens-servico/$ordemId', params: { ordemId: String(recente.id) } } as const)

/** As OS de um status, da mais antiga para a mais nova (a fila do B e a lista do C). */
function useOsDoStatus(status: StatusOS, quantas: number) {
  return useOrdensServico({
    campo: 'status',
    busca: status,
    page: 1,
    pageSize: quantas,
    ordem: 'abertura',
    direcao: 'asc',
  })
}

/* ---------------------------------------------------------------- B · Painel */

export function InicioPainel() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const abrirBusca = useBuscaRapidaStore((estado) => estado.abrir)
  const { data } = usePainel()
  const admin = usuario?.role === 'admin'

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            {diaPorExtenso(data?.hoje)}
          </p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">Olá, {usuario?.usuario}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={abrirBusca}>
            <Search /> Buscar cliente ou OS
          </Button>
          {ATALHOS.map((atalho) => (
            <Button key={atalho.to} asChild variant="outline" className="rounded-full">
              <Link to={atalho.to}>{atalho.rotulo}</Link>
            </Button>
          ))}
        </div>
      </div>
      {admin && <AvisoBackup />}
      {data ? (
        <section
          aria-label="Números do dia e do mês"
          className="grid grid-cols-2 overflow-hidden rounded-sm border bg-card md:grid-cols-3 xl:grid-cols-6"
        >
          {numerosDoPainel(data).map((numero) => (
            <div key={numero.titulo} className="border-r border-b px-5 py-4">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {numero.titulo}
              </p>
              <p className="mt-1 font-semibold text-2xl tabular-nums">{numero.valor}</p>
            </div>
          ))}
        </section>
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
      <section aria-label="Fila de trabalho" className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-lg">Fila de trabalho</h2>
          <Link to="/ordens-servico" className="font-semibold text-primary text-sm">
            Abrir ordens de serviço
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STATUS_EM_ANDAMENTO.map((status) => (
            <ColunaDaFila key={status} status={status} />
          ))}
        </div>
      </section>
    </>
  )
}

function ColunaDaFila({ status }: { status: StatusOS }) {
  const { data, isLoading } = useOsDoStatus(status, 6)
  return (
    <div className="grid content-start gap-2 rounded-md bg-muted/60 p-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-sm">{ROTULO_STATUS[status]}</h3>
        <span className="text-muted-foreground text-xs">
          {data ? plural(data.total, 'OS', 'OS') : ''}
        </span>
      </div>
      {isLoading && <Skeleton className="h-16 w-full" />}
      {data?.items.length === 0 && (
        <p className="px-1 py-2 text-muted-foreground text-sm">Nenhuma OS.</p>
      )}
      {data?.items.map((os) => (
        <Link
          key={os.id}
          to="/ordens-servico/$ordemId"
          params={{ ordemId: String(os.id) }}
          className="grid gap-0.5 rounded-sm border bg-card p-3 hover:bg-accent"
        >
          <span className="flex justify-between text-muted-foreground text-xs">
            <span>OS {os.id}</span>
            <span>aberta em {formatarData(os.abertura)}</span>
          </span>
          <span className="font-semibold text-sm">{os.aparelhoNome}</span>
          <span className="text-muted-foreground text-sm">{os.clienteNome}</span>
        </Link>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- C · Balcão */

export function InicioBalcao() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const abrirBusca = useBuscaRapidaStore((estado) => estado.abrir)
  const recentes = useRecentes().slice(0, 5)
  const { data } = usePainel()
  const admin = usuario?.role === 'admin'

  return (
    <>
      {admin && <AvisoBackup />}
      <section className="grid max-w-4xl gap-3">
        <h1 className="font-extrabold text-3xl tracking-tight">Quem chegou no balcão?</h1>
        <button
          type="button"
          onClick={abrirBusca}
          className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-primary bg-card px-5 text-left text-lg text-muted-foreground"
        >
          <Search className="size-6 text-primary" />
          <span className="flex-1">Nome, telefone, CPF ou número da OS</span>
          <kbd className="rounded border px-2 text-xs">Ctrl K</kbd>
        </button>
        {recentes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            Recentes:
            {recentes.map((recente) => (
              <Link
                key={`${recente.tipo}-${recente.id}`}
                {...linkDoRecente(recente)}
                className="rounded-full border bg-card px-3 py-1.5 text-foreground hover:bg-accent"
              >
                {recente.titulo}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Ações rápidas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ATALHOS.map((atalho, indice) => {
          const Icone = atalho.icone
          return (
            <Link
              key={atalho.to}
              to={atalho.to}
              className={cn(
                'grid min-h-28 content-between gap-3 rounded-2xl border p-5 transition-colors',
                indice === 0
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-card hover:bg-accent',
              )}
            >
              <Icone className="size-6" />
              <span>
                <span className="block font-extrabold text-base">{atalho.rotulo}</span>
                <span className="block text-sm opacity-80">{atalho.detalhe}</span>
              </span>
            </Link>
          )
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <ListaAguardando />
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {data ? (
            numerosDoPainel(data)
              .slice(0, 4)
              .map((numero) => (
                <div key={numero.titulo} className="rounded-2xl border bg-card p-4">
                  <p className="text-muted-foreground text-sm">{numero.titulo}</p>
                  <p className="mt-1 font-extrabold text-2xl tabular-nums">{numero.valor}</p>
                </div>
              ))
          ) : (
            <Skeleton className="h-40 w-full sm:col-span-2" />
          )}
        </div>
      </div>
    </>
  )
}

function ListaAguardando() {
  const { data, isLoading } = useOsDoStatus('AGUARDANDO', 6)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aguardando</CardTitle>
        <CardDescription>OS esperando peça ou resposta do cliente, da mais antiga.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {data?.items.length === 0 && (
          <p className="text-muted-foreground text-sm">Nenhuma OS aguardando.</p>
        )}
        {data?.items.map((os) => (
          <div
            key={os.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t py-3 first:border-t-0"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {os.clienteNome} · {os.aparelhoNome}
              </p>
              <p className="text-muted-foreground text-sm">
                OS {os.id} · aberta em {formatarData(os.abertura)}
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/ordens-servico/$ordemId" params={{ ordemId: String(os.id) }}>
                Abrir OS
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- D · Planilha */

export function InicioPlanilha() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const abrirBusca = useBuscaRapidaStore((estado) => estado.abrir)
  const recentes = useRecentes()
  const { data } = usePainel()
  const admin = usuario?.role === 'admin'

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-semibold text-lg">Início</h1>
        <span className="text-muted-foreground text-sm">{diaPorExtenso(data?.hoje)}</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" onClick={abrirBusca}>
            <Search /> Buscar (Ctrl K)
          </Button>
          {ATALHOS.map((atalho) => (
            <Button key={atalho.to} asChild size="sm" variant="outline">
              <Link to={atalho.to}>{atalho.rotulo}</Link>
            </Button>
          ))}
        </div>
      </div>
      {admin && <AvisoBackup />}
      {data ? (
        <section
          aria-label="Números do dia e do mês"
          className="grid grid-cols-2 rounded-sm border bg-card md:grid-cols-3 xl:grid-cols-6"
        >
          {numerosDoPainel(data).map((numero) => (
            <div key={numero.titulo} className="border-r px-4 py-2.5 last:border-r-0">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {numero.titulo}
              </p>
              <p className="font-semibold text-xl tabular-nums">{numero.valor}</p>
            </div>
          ))}
        </section>
      ) : (
        <Skeleton className="h-16 w-full" />
      )}
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <section
          aria-label="Paradas há mais tempo"
          className="overflow-hidden rounded-sm border bg-card"
        >
          <h2 className="border-b px-4 py-2 font-semibold text-sm">Paradas há mais tempo</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Parada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.paradas ?? []).map((os) => (
                <TableRow key={os.id}>
                  <TableCell>
                    <Link
                      to="/ordens-servico/$ordemId"
                      params={{ ordemId: String(os.id) }}
                      className="font-semibold text-primary"
                    >
                      {os.id}
                    </Link>
                  </TableCell>
                  <TableCell>{os.clienteNome}</TableCell>
                  <TableCell className="text-muted-foreground">{os.aparelhoNome}</TableCell>
                  <TableCell>
                    <EtiquetaStatus status={os.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{dias(os.dias)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <section aria-label="Abertos recentemente" className="rounded-sm border bg-card">
          <h2 className="border-b px-4 py-2 font-semibold text-sm">Abertos recentemente</h2>
          {recentes.length === 0 ? (
            <p className="px-4 py-3 text-muted-foreground text-sm">Nenhuma ficha aberta ainda.</p>
          ) : (
            <ul className="text-sm">
              {recentes.map((recente) => {
                const Icone = recente.tipo === 'cliente' ? UserRound : ClipboardList
                return (
                  <li key={`${recente.tipo}-${recente.id}`} className="border-b last:border-b-0">
                    <Link
                      {...linkDoRecente(recente)}
                      className="flex items-center gap-2 px-4 py-1.5 hover:bg-muted"
                    >
                      <Icone className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{recente.titulo}</span>
                      <span className="truncate text-muted-foreground">{recente.detalhe}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- E · Cartões */

export function InicioCartoes() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const abrirBusca = useBuscaRapidaStore((estado) => estado.abrir)
  const recentes = useRecentes().slice(0, 6)
  const { data } = usePainel()
  const admin = usuario?.role === 'admin'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-3xl tracking-tight">Olá, {usuario?.usuario}!</h1>
          <p className="text-muted-foreground">{diaPorExtenso(data?.hoje)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" variant="outline" onClick={abrirBusca}>
            <Search /> Buscar
          </Button>
          <Button asChild size="lg">
            <Link to="/clientes/novo">
              <UserPlus /> Cadastrar cliente
            </Link>
          </Button>
        </div>
      </div>
      {admin && <AvisoBackup />}
      {data ? (
        <section
          aria-label="Números do dia e do mês"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {numerosDoPainel(data)
            .slice(0, 4)
            .map((numero) => (
              <div key={numero.titulo} className="rounded-2xl border bg-card p-5">
                <p className="font-semibold text-muted-foreground">{numero.titulo}</p>
                <p className="mt-1 font-extrabold text-3xl tabular-nums">{numero.valor}</p>
              </div>
            ))}
        </section>
      ) : (
        <Skeleton className="h-28 w-full" />
      )}
      <section aria-label="Paradas há mais tempo" className="grid gap-3">
        <h2 className="font-extrabold text-xl">Paradas há mais tempo</h2>
        {data?.paradas.length === 0 && (
          <p className="text-muted-foreground">Nenhuma OS em andamento.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(data?.paradas ?? []).map((os) => (
            <article key={os.id} className="grid gap-3 rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-muted-foreground text-sm">OS {os.id}</span>
                <EtiquetaStatus status={os.status} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">{os.aparelhoNome}</h3>
                <p className="text-muted-foreground">{os.clienteNome}</p>
              </div>
              <p className="text-muted-foreground text-sm">
                Aberta em {formatarData(os.abertura)} · {dias(os.dias)}
              </p>
              <Button asChild variant="secondary" size="lg">
                <Link to="/ordens-servico/$ordemId" params={{ ordemId: String(os.id) }}>
                  Abrir
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
      {recentes.length > 0 && (
        <section aria-label="Abertos recentemente" className="grid gap-3">
          <h2 className="font-extrabold text-xl">Abertos recentemente</h2>
          <div className="flex flex-wrap gap-2">
            {recentes.map((recente) => (
              <Link
                key={`${recente.tipo}-${recente.id}`}
                {...linkDoRecente(recente)}
                className="rounded-2xl border bg-card px-4 py-3 hover:bg-accent"
              >
                <span className="block font-bold">{recente.titulo}</span>
                <span className="block text-muted-foreground text-sm">{recente.detalhe}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
