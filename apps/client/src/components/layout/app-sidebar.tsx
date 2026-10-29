import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { Fragment, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dica } from '@/components/ui/tooltip'
import { useLogout } from '@/hooks/use-auth'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useVersao } from '@/hooks/use-sistema'
import { ROTULO_ROLE } from '@/models/usuario.model'
import { BuscaRapida } from './busca-rapida'
import { ThemeToggle } from './theme-toggle'

export interface ItemMenu {
  to: string
  rotulo: string
  icone: LucideIcon
  somenteAdmin: boolean
  grupo: string | null
  /** Só fica ativo na rota exata (sem as filhas). */
  exato?: boolean
}

/** Item ativo do menu: a marca à esquerda é uma sombra interna, que acompanha o canto arredondado. */
export const MENU_ATIVO =
  'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)] ring-1 ring-sidebar-border ring-inset'

/** Botões só de ícone do menu: as cores do menu nos dois temas, também no hover. */
export const BOTAO_DO_MENU =
  'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-foreground'

export const ITENS_DO_MENU: ItemMenu[] = [
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
  { to: '/usuarios', rotulo: 'Usuários', icone: Users, somenteAdmin: true, grupo: 'Sistema' },
  {
    to: '/configuracoes',
    rotulo: 'Configurações',
    icone: Settings,
    somenteAdmin: false,
    grupo: 'Sistema',
  },
]

export function AppSidebar() {
  const usuario = useSessionStore((estado) => estado.usuario)
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: versao } = useVersao()

  const { menuRecolhido: recolhido, alternarMenu } = usePreferenciasStore()

  const sair = () => logout.mutate(undefined, { onSettled: () => navigate({ to: '/login' }) })

  // Ctrl+B recolhe/expande o menu de qualquer tela.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (!(evento.ctrlKey || evento.metaKey) || evento.key.toLowerCase() !== 'b') return
      evento.preventDefault()
      alternarMenu()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [alternarMenu])

  const IconeMenu = recolhido ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      data-menu
      data-recolhido={recolhido}
      className={cn(
        'flex shrink-0 print:hidden flex-col bg-sidebar text-sidebar-foreground transition-[width]',
        recolhido ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex items-center gap-3 p-3', recolhido && 'flex-col')}>
        <img src="/logo.jpg" alt="" className="size-10 rounded-md bg-white object-contain" />
        {!recolhido && <span className="flex-1 font-semibold tracking-tight">Brastem-Service</span>}
        <Button
          variant="ghost"
          size="icon-sm"
          className={BOTAO_DO_MENU}
          aria-label={recolhido ? 'Expandir menu (Ctrl+B)' : 'Recolher menu (Ctrl+B)'}
          aria-expanded={!recolhido}
          onClick={alternarMenu}
        >
          <IconeMenu />
        </Button>
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="px-3 pt-3">
        <BuscaRapida compacta={recolhido} />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {ITENS_DO_MENU.filter((item) => !item.somenteAdmin || usuario?.role === 'admin').map(
          (item, indice, visiveis) => {
            const Icone = item.icone
            const novoGrupo = item.grupo && item.grupo !== visiveis[indice - 1]?.grupo
            return (
              <Fragment key={item.to}>
                {novoGrupo &&
                  (recolhido ? (
                    <Separator className="my-2 bg-sidebar-border" />
                  ) : (
                    <p className="mt-3 px-3 pb-1 text-sidebar-foreground/60 text-xs uppercase tracking-wide">
                      {item.grupo}
                    </p>
                  ))}
                <Dica texto={recolhido ? item.rotulo : undefined} lado="right">
                  <Link
                    to={item.to}
                    search={buscaLembrada(item.to)}
                    activeOptions={{ exact: item.exato }}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                      recolhido && 'justify-center px-0',
                    )}
                    // Ativo: fundo um pouco mais claro, contorno sutil e a marca da cor de destaque à
                    // esquerda (R-UX-15).
                    activeProps={{
                      className: MENU_ATIVO,
                    }}
                  >
                    <Icone className="size-4 shrink-0" />
                    {/* Recolhido, o nome some da tela mas continua para leitores de tela. */}
                    <span className={cn(recolhido && 'sr-only')}>{item.rotulo}</span>
                  </Link>
                </Dica>
              </Fragment>
            )
          },
        )}
      </nav>

      <Separator className="bg-sidebar-border" />
      <div
        className={cn(
          'flex items-center justify-between gap-2 p-3',
          recolhido && 'flex-col justify-center',
        )}
      >
        <div className={cn('min-w-0', recolhido && 'sr-only')}>
          <p className="truncate font-medium text-sm">{usuario?.usuario}</p>
          <p className="text-sidebar-foreground/70 text-xs">
            {usuario ? ROTULO_ROLE[usuario.role] : ''}
          </p>
          {versao && (
            <p className="text-sidebar-foreground/50 text-xs">
              {versao === 'desenvolvimento' ? 'Desenvolvimento' : `Versão ${versao}`}
            </p>
          )}
        </div>
        <div className={cn('flex items-center', recolhido && 'flex-col')}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            // Vermelho só ao passar o mouse: avisa que sai do sistema sem chamar atenção o tempo todo.
            className="text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-red-400 dark:hover:bg-destructive/20 dark:hover:text-red-400"
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
