import { Link, useNavigate } from '@tanstack/react-router'
import { Home, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLogout } from '@/hooks/use-auth'
import { useSessionStore } from '@/hooks/use-session-store'
import { ROTULO_ROLE } from '@/models/usuario.model'
import { ThemeToggle } from './theme-toggle'

const itens = [
  { to: '/', rotulo: 'Início', icone: Home, somenteAdmin: false },
  { to: '/usuarios', rotulo: 'Usuários', icone: Users, somenteAdmin: true },
] as const

export function AppSidebar() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const logout = useLogout()
  const navigate = useNavigate()

  const sair = () => logout.mutate(undefined, { onSettled: () => navigate({ to: '/login' }) })

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 p-4">
        <img src="/logo.jpg" alt="" className="size-10 rounded-md bg-white object-contain" />
        <span className="font-semibold tracking-tight">Brastem-Service</span>
      </div>
      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {itens
          .filter((item) => !item.somenteAdmin || usuario?.role === 'admin')
          .map(({ to, rotulo, icone: Icone }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{
                className:
                  'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
              }}
            >
              <Icone className="size-4" />
              {rotulo}
            </Link>
          ))}
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
