import { Link, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  type LucideIcon,
  Settings,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLogout } from '@/hooks/use-auth'
import { useSessionStore } from '@/hooks/use-session-store'
import { ROTULO_ROLE } from '@/models/usuario.model'
import { ThemeToggle } from './theme-toggle'

interface ItemMenu {
  to: string
  rotulo: string
  icone: LucideIcon
  somenteAdmin: boolean
  grupo: string | null
  /** Só fica ativo na rota exata (sem as filhas). */
  exato?: boolean
}

const itens: ItemMenu[] = [
  { to: '/', rotulo: 'Início', icone: Home, somenteAdmin: false, grupo: null, exato: true },
  { to: '/clientes', rotulo: 'Clientes', icone: UserRound, somenteAdmin: false, grupo: null },
  {
    to: '/ordens-servico',
    rotulo: 'Ordens de serviço',
    icone: ClipboardList,
    somenteAdmin: false,
    grupo: null,
  },
  {
    to: '/caixa',
    rotulo: 'Caixa',
    icone: Wallet,
    somenteAdmin: true,
    grupo: 'Financeiro',
    exato: true,
  },
  {
    to: '/caixa/receita',
    rotulo: 'Lançar receita',
    icone: TrendingUp,
    somenteAdmin: false,
    grupo: 'Financeiro',
  },
  {
    to: '/caixa/despesa',
    rotulo: 'Lançar despesa',
    icone: TrendingDown,
    somenteAdmin: false,
    grupo: 'Financeiro',
  },
  {
    to: '/pagamentos',
    rotulo: 'Pagamentos',
    icone: CreditCard,
    somenteAdmin: true,
    grupo: 'Financeiro',
  },
  {
    to: '/relatorios',
    rotulo: 'Relatórios',
    icone: BarChart3,
    somenteAdmin: true,
    grupo: 'Financeiro',
  },
  { to: '/usuarios', rotulo: 'Usuários', icone: Users, somenteAdmin: true, grupo: 'Administração' },
  {
    to: '/configuracoes',
    rotulo: 'Configurações',
    icone: Settings,
    somenteAdmin: true,
    grupo: 'Administração',
  },
]

export function AppSidebar() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const logout = useLogout()
  const navigate = useNavigate()

  const sair = () => logout.mutate(undefined, { onSettled: () => navigate({ to: '/login' }) })

  return (
    <aside className="flex w-60 shrink-0 print:hidden flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 p-4">
        <img src="/logo.jpg" alt="" className="size-10 rounded-md bg-white object-contain" />
        <span className="font-semibold tracking-tight">Brastem-Service</span>
      </div>
      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {itens
          .filter((item) => !item.somenteAdmin || usuario?.role === 'admin')
          .map((item, indice, visiveis) => {
            const Icone = item.icone
            const novoGrupo = item.grupo && item.grupo !== visiveis[indice - 1]?.grupo
            return (
              <Fragment key={item.to}>
                {novoGrupo && (
                  <p className="mt-3 px-3 pb-1 text-sidebar-foreground/60 text-xs uppercase tracking-wide">
                    {item.grupo}
                  </p>
                )}
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exato }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                  activeProps={{
                    className:
                      'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
                  }}
                >
                  <Icone className="size-4" />
                  {item.rotulo}
                </Link>
              </Fragment>
            )
          })}
      </nav>

      <Separator className="bg-sidebar-border" />
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{usuario?.usuario}</p>
          <p className="text-sidebar-foreground/70 text-xs">
            {usuario ? ROTULO_ROLE[usuario.role] : ''}
          </p>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={sair}
            disabled={logout.isPending}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </aside>
  )
}
