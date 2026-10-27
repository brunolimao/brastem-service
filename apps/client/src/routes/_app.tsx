import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AvisoSairSemSalvar } from '@/components/layout/aviso-sair-sem-salvar'
import { carregarSessao, useSessionStore } from '@/hooks/use-session-store'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    await carregarSessao()
    if (useSessionStore.getState().situacao !== 'autenticada') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => (
    <div className="fixed inset-0 flex overflow-hidden print:static print:block print:overflow-visible">
      <AppSidebar />
      <AvisoSairSemSalvar />
      <main className="min-w-0 flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
        <div className="mx-auto grid max-w-6xl gap-6 print:max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  ),
})
