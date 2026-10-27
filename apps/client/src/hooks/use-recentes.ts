import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSessionStore } from './use-session-store'

export interface Recente {
  tipo: 'cliente' | 'os'
  id: number
  titulo: string
  detalhe: string
}

interface RecentesState {
  /** Por usuário: cada pessoa que entra neste computador vê as próprias fichas. */
  porUsuario: Record<number, Recente[]>
  registrar: (usuarioId: number, recente: Recente) => void
}

/** Quantas fichas o Início lembra. */
export const MAXIMO_RECENTES = 8

const mesmo = (a: Recente, b: Recente) => a.tipo === b.tipo && a.id === b.id

/** Fichas de cliente e de OS abertas por último (guardadas neste computador). */
export const useRecentesStore = create<RecentesState>()(
  persist(
    (set) => ({
      porUsuario: {},
      registrar: (usuarioId, recente) =>
        set((estado) => ({
          porUsuario: {
            ...estado.porUsuario,
            [usuarioId]: [
              recente,
              ...(estado.porUsuario[usuarioId] ?? []).filter((item) => !mesmo(item, recente)),
            ].slice(0, MAXIMO_RECENTES),
          },
        })),
    }),
    { name: 'brastem-recentes' },
  ),
)

/** As fichas recentes de quem está logado, da mais nova para a mais antiga. */
export function useRecentes(): Recente[] {
  const usuarioId = useSessionStore((estado) => estado.usuario?.id)
  return useRecentesStore((estado) =>
    usuarioId === undefined ? SEM_RECENTES : (estado.porUsuario[usuarioId] ?? SEM_RECENTES),
  )
}

const SEM_RECENTES: Recente[] = []

/** Chamado pelas fichas de cliente e de OS quando os dados chegam. */
export function useRegistrarRecente(recente: Recente | undefined) {
  const usuarioId = useSessionStore((estado) => estado.usuario?.id)
  const registrar = useRecentesStore((estado) => estado.registrar)
  const chave = recente && `${recente.tipo}-${recente.id}-${recente.titulo}-${recente.detalhe}`
  // biome-ignore lint/correctness/useExhaustiveDependencies: a chave resume o recente (objeto novo a cada render)
  useEffect(() => {
    if (recente && usuarioId !== undefined) registrar(usuarioId, recente)
  }, [chave, usuarioId, registrar])
}
