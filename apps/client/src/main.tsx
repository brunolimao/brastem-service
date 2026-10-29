import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { useSessionStore } from '@/hooks/use-session-store'
import { aplicarTema, useThemeStore } from '@/hooks/use-theme-store'
import { aplicarModelo } from '@/libs/modelos-de-tela'
import { queryClient } from '@/libs/query-client'
import '@/libs/zod'
import { configurarApi } from '@/services/api'
import { router } from './router'
import './index.css'

aplicarTema(useThemeStore.getState().tema, useThemeStore.getState().paleta)
aplicarModelo(useThemeStore.getState().modelo)

configurarApi({
  aoExpirarSessao: () => {
    // Várias chamadas podem falhar juntas; só a primeira derruba a sessão e avisa.
    if (useSessionStore.getState().situacao !== 'autenticada') return
    useSessionStore.getState().sair()
    queryClient.clear()
    toast.warning('Sua sessão expirou. Entre novamente.')
    router.navigate({ to: '/login', search: { redirect: router.state.location.href } })
  },
})

// biome-ignore lint/style/noNonNullAssertion: o elemento existe no index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
