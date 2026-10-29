import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AvisoSairSemSalvar } from '@/components/layout/aviso-sair-sem-salvar'
import { BarraTopo } from '@/components/layout/barra-topo'
import { useLembrarListas } from '@/hooks/use-listas-lembradas'
import { carregarSessao, useSessionStore } from '@/hooks/use-session-store'
import { useThemeStore } from '@/hooks/use-theme-store'
import { menuDoModelo } from '@/libs/modelos-de-tela'
import { cn } from '@/libs/utils'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    await carregarSessao()
    if (useSessionStore.getState().situacao !== 'autenticada') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: LayoutDoApp,
})

function LayoutDoApp() {
  useLembrarListas()
  // Modelos de tela em teste: menu lateral (escuro ou claro) ou numa barra no topo.
  const modelo = useThemeStore((estado) => estado.modelo)
  const noTopo = menuDoModelo(modelo) === 'topo'
  return (
    <div
      className={cn(
        'fixed inset-0 flex overflow-hidden print:static print:block print:overflow-visible',
        noTopo && 'flex-col',
      )}
    >
      {noTopo ? <BarraTopo compacta={modelo === 'planilha'} /> : <AppSidebar />}
      <AvisoSairSemSalvar />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0">
        {/* grid-cols-1 = minmax(0, 1fr): tabela larga rola dentro dela, em vez de alargar a página inteira.
            max-w-screen-2xl: tela grande aproveita a largura (a tabela de OS cabe sem rolar), mas sem esticar
            demais o texto em monitores muito largos. */}
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 print:max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
