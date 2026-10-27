import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  AArrowDown,
  AArrowUp,
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
import { useLogout } from '@/hooks/use-auth'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { TAMANHOS_DE_LETRA, usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useSessionStore } from '@/hooks/use-session-store'
import { useProcurarAtualizacao, useVersao } from '@/hooks/use-sistema'
import { ROTULO_ROLE } from '@/models/usuario.model'
import { BuscaRapida } from './busca-rapida'
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
  const { data: versao } = useVersao()
  const procurar = useProcurarAtualizacao()

  const {
    menuRecolhido: recolhido,
    alternarMenu,
    tamanhoDeLetra,
    mudarLetra,
  } = usePreferenciasStore()

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
        {itens
          .filter((item) => !item.somenteAdmin || usuario?.role === 'admin')
          .map((item, indice, visiveis) => {
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
                <Link
                  to={item.to}
                  search={buscaLembrada(item.to)}
                  activeOptions={{ exact: item.exato }}
                  title={recolhido ? item.rotulo : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                    recolhido && 'justify-center px-0',
                  )}
                  activeProps={{
                    className:
                      'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
                  }}
                >
                  <Icone className="size-4 shrink-0" />
                  {/* Recolhido, o nome some da tela mas continua para leitores de tela. */}
                  <span className={cn(recolhido && 'sr-only')}>{item.rotulo}</span>
                </Link>
              </Fragment>
            )
          })}
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
          {versao && versao !== 'desenvolvimento' && (
            <button
              type="button"
              className="text-sidebar-foreground/70 text-xs underline-offset-2 hover:text-sidebar-foreground hover:underline disabled:opacity-50"
              onClick={() => procurar.mutate()}
              disabled={procurar.isPending}
            >
              Procurar atualização
            </button>
          )}
        </div>
        <div className={cn('flex items-center', recolhido && 'flex-col')}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Diminuir a letra"
            title="Diminuir a letra"
            disabled={tamanhoDeLetra === 0}
            onClick={() => mudarLetra(-1)}
          >
            <AArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Aumentar a letra"
            title="Aumentar a letra"
            disabled={tamanhoDeLetra === TAMANHOS_DE_LETRA.length - 1}
            onClick={() => mudarLetra(1)}
          >
            <AArrowUp />
          </Button>
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
