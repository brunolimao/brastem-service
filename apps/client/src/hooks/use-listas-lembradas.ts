import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Listas que reabrem no ponto em que ficaram (busca, página, ordem, período). */
export const LISTAS_LEMBRADAS = [
  '/clientes',
  '/ordens-servico',
  '/pagamentos',
  '/caixa',
  '/usuarios',
  '/relatorios',
] as const

type Busca = Record<string, unknown>

interface ListasState {
  buscas: Record<string, Busca>
  lembrar: (caminho: string, busca: Busca) => void
}

/** Guardado só enquanto o app está aberto (sessão): ao reabrir, as listas começam do início. */
export const useListasLembradasStore = create<ListasState>()(
  persist(
    (set) => ({
      buscas: {},
      lembrar: (caminho, busca) =>
        set((estado) => ({ buscas: { ...estado.buscas, [caminho]: busca } })),
    }),
    { name: 'brastem-listas', storage: createJSONStorage(() => sessionStorage) },
  ),
)

/** A busca com que a lista ficou da última vez (ou nenhuma). */
export const buscaLembrada = (caminho: string): Busca | undefined =>
  useListasLembradasStore.getState().buscas[caminho]

/** No layout: a cada troca de tela, guarda a busca da lista que está aberta. */
export function useLembrarListas() {
  const local = useRouterState({ select: (estado) => estado.location })
  const lembrar = useListasLembradasStore((estado) => estado.lembrar)
  useEffect(() => {
    if ((LISTAS_LEMBRADAS as readonly string[]).includes(local.pathname)) {
      lembrar(local.pathname, local.search as Busca)
    }
  }, [local, lembrar])
}
