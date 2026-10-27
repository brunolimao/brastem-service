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
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBuscaRapidaStore } from '@/hooks/use-busca-rapida'
import { useRecentes } from '@/hooks/use-recentes'
import { useSessionStore } from '@/hooks/use-session-store'

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
            <kbd className="ml-1 rounded border border-primary-foreground/40 px-1.5 text-xs">
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
            <ul className="grid gap-1">
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
                      <span className="truncate font-medium text-sm">{recente.titulo}</span>
                      <span className="truncate text-muted-foreground text-sm">
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
