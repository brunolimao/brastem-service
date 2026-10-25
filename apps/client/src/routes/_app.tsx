import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { carregarSessao, useSessionStore } from '@/hooks/use-session-store'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    await carregarSessao()
    if (useSessionStore.getState().situacao !== 'autenticada') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-8">
        <div className="mx-auto grid max-w-6xl gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  ),
})
