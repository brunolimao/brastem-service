import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ClipboardList,
  type LucideIcon,
  Search,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react'
import { GraficoPizza } from '@/components/charts/grafico-pizza'
import { Indicador } from '@/components/domain/indicador'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBuscaRapidaStore } from '@/hooks/use-busca-rapida'
import { usePainel } from '@/hooks/use-painel'
import { useRecentes } from '@/hooks/use-recentes'
import { useSessionStore } from '@/hooks/use-session-store'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { COR_DO_STATUS, ROTULO_STATUS } from '@/models/ordem-servico.model'
import { type Painel, STATUS_EM_ANDAMENTO } from '@/models/painel.model'

export const Route = createFileRoute('/_app/')({ component: InicioPage })

interface Atalho {
  to: string
  rotulo: string
  icone: LucideIcon
  somenteAdmin?: boolean
}

const ATALHOS: Atalho[] = [
  { to: '/clientes/novo', rotulo: 'Cadastrar cliente', icone: UserPlus },
  { to: '/ordens-servico', rotulo: 'Ordens de serviço', icone: ClipboardList },
  { to: '/caixa/receita', rotulo: 'Lançar receita', icone: TrendingUp },
  { to: '/caixa/despesa', rotulo: 'Lançar despesa', icone: TrendingDown },
  { to: '/caixa', rotulo: 'Caixa', icone: Wallet, somenteAdmin: true },
]

function InicioPage() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const abrirBusca = useBuscaRapidaStore((estado) => estado.abrir)
  const recentes = useRecentes()
  const admin = usuario?.role === 'admin'

  return (
    <>
      <PageHeader titulo={`Olá, ${usuario?.usuario ?? ''}`} descricao="O que vamos fazer agora?" />
      <Card>
        <CardHeader>
          <CardTitle>Atalhos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={abrirBusca}>
            <Search /> Buscar cliente ou OS
            <kbd className="ml-1 hidden rounded border border-primary-foreground/40 px-1.5 text-xs md:inline">
              Ctrl K
            </kbd>
          </Button>
          {ATALHOS.filter((atalho) => admin || !atalho.somenteAdmin).map((atalho) => {
            const Icone = atalho.icone
            return (
              <Button key={atalho.to} asChild variant="outline">
                <Link to={atalho.to}>
                  <Icone /> {atalho.rotulo}
                </Link>
              </Button>
            )
          })}
        </CardContent>
      </Card>

      <Resumo />

      <Card>
        <CardHeader>
          <CardTitle>Abertos recentemente</CardTitle>
          <CardDescription>Clientes e ordens de serviço que você abriu por último.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              As fichas que você abrir aparecem aqui, para voltar a elas com um clique.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-1">
              {recentes.map((recente) => {
                const Icone = recente.tipo === 'cliente' ? UserRound : ClipboardList
                return (
                  <li key={`${recente.tipo}-${recente.id}`}>
                    <Link
                      {...(recente.tipo === 'cliente'
                        ? { to: '/clientes/$clienteId', params: { clienteId: String(recente.id) } }
                        : {
                            to: '/ordens-servico/$ordemId',
                            params: { ordemId: String(recente.id) },
                          })}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
                    >
                      <Icone className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate font-medium text-sm">{recente.titulo}</span>
                      <span className="min-w-0 truncate text-muted-foreground text-sm">
                        {recente.detalhe}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}

const plural = (quantidade: number, um: string, varios: string) =>
  `${quantidade} ${quantidade === 1 ? um : varios}`

/** Números do dia e do mês, OS em andamento por status e as paradas há mais tempo (R-UX-12). */
function Resumo() {
  const { data, isLoading } = usePainel()
  if (isLoading || !data) return <Skeleton className="h-48 w-full" />

  const { emAndamento } = data.ordens
  const totalEmAndamento = STATUS_EM_ANDAMENTO.reduce(
    (soma, status) => soma + emAndamento[status],
    0,
  )

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="OS em andamento"
          valor={String(totalEmAndamento)}
          detalhe={`${emAndamento.AGUARDANDO} aguardando · ${emAndamento.APROVADO} aprovadas`}
        />
        <Indicador titulo="Abertas hoje" valor={String(data.ordens.abertasHoje)} />
        <Indicador titulo="Fechadas no mês" valor={String(data.ordens.fechadasNoMes)} />
        <Indicador titulo="Clientes novos no mês" valor={String(data.clientesNovosNoMes)} />
        {data.financeiro && (
          <>
            <Indicador
              titulo="Faturamento do mês"
              valor={formatarMoeda(data.financeiro.faturamentoMes)}
              detalhe="OS fechadas, fora da garantia"
            />
            <Indicador
              titulo="Caixa do mês"
              valor={formatarMoeda(data.financeiro.caixaMes)}
              detalhe="Entradas menos saídas"
              negativo={data.financeiro.caixaMes < 0}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficoPizza
          titulo="OS em andamento por status"
          cores={STATUS_EM_ANDAMENTO.map((status) => COR_DO_STATUS[status])}
          dados={STATUS_EM_ANDAMENTO.map((status) => ({
            name: ROTULO_STATUS[status],
            value: emAndamento[status],
          }))}
        />
        <OsParadas paradas={data.paradas} />
      </div>
    </>
  )
}

function OsParadas({ paradas }: { paradas: Painel['paradas'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paradas há mais tempo</CardTitle>
        <CardDescription>
          OS em andamento, da abertura mais antiga para a mais nova.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paradas.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma OS em andamento.</p>
        ) : (
          <ul aria-label="OS paradas há mais tempo" className="grid grid-cols-1 gap-1">
            {paradas.map((os) => (
              <li key={os.id}>
                <Link
                  to="/ordens-servico/$ordemId"
                  params={{ ordemId: String(os.id) }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      OS {os.id} · {os.clienteNome}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {os.aparelhoNome} · aberta em {formatarData(os.abertura)}
                    </p>
                  </div>
                  {/* Status e dias empilhados, sem largura fixa: cabem em tela estreita e com letra maior. */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary">{ROTULO_STATUS[os.status]}</Badge>
                    <span className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
                      {os.dias === 0 ? 'hoje' : plural(os.dias, 'dia', 'dias')}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
