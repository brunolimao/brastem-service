import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/use-auth'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { useSessionStore } from '@/hooks/use-session-store'
import { ITENS_DO_MENU } from './app-sidebar'
import { BuscaRapida } from './busca-rapida'
import { ThemeToggle } from './theme-toggle'

/** Cabem numa linha só: lançar receita/despesa ficam nos atalhos do Início e no Caixa. */
const FORA_DA_BARRA = ['/caixa/receita', '/caixa/despesa']

/**
 * Menu numa barra no topo (modelos de tela B · Painel e D · Planilha, em teste): os mesmos itens do menu
 * lateral, em linha, com o ativo sublinhado na cor de destaque. `compacta` é a do D (mais baixa).
 */
export function BarraTopo({ compacta = false }: { compacta?: boolean }) {
  const usuario = useSessionStore((estado) => estado.usuario)
  const logout = useLogout()
  const navigate = useNavigate()
  const sair = () => logout.mutate(undefined, { onSettled: () => navigate({ to: '/login' }) })

  return (
    <header
      data-menu
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 bg-sidebar px-4 text-sidebar-foreground print:hidden',
        compacta ? 'min-h-11 text-[0.8125rem]' : 'min-h-14 text-sm',
      )}
    >
      <div className="flex items-center gap-2 py-2 font-semibold">
        <img src="/logo.jpg" alt="" className="size-8 rounded bg-white object-contain" />
        <span>Brastem-Service</span>
      </div>
      <nav aria-label="Menu principal" className="flex flex-1 flex-wrap">
        {ITENS_DO_MENU.filter(
          (item) =>
            (!item.somenteAdmin || usuario?.role === 'admin') && !FORA_DA_BARRA.includes(item.to),
        ).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            search={buscaLembrada(item.to)}
            activeOptions={{ exact: item.exato }}
            className={cn(
              'border-transparent border-b-2 px-2.5 text-sidebar-foreground/75 transition-colors hover:text-sidebar-foreground',
              compacta ? 'pt-3 pb-2.5' : 'pt-4 pb-3.5',
            )}
            activeProps={{
              className: 'border-sidebar-primary! font-semibold text-sidebar-foreground!',
            }}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-1 py-1">
        <div className="w-44">
          <BuscaRapida />
        </div>
        <ThemeToggle />
        <span className="px-1 text-sidebar-foreground/75 text-xs">{usuario?.usuario}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sair"
          className="text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-red-400 dark:hover:bg-destructive/20 dark:hover:text-red-400"
          onClick={sair}
          disabled={logout.isPending}
        >
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
