import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors closeButton />
    </>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-svh place-items-center p-6 text-center">
      <div className="grid gap-4">
        <h1 className="font-semibold text-2xl">Página não encontrada</h1>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  ),
})
