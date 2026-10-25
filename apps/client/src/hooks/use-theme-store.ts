import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tema = 'claro' | 'escuro' | 'sistema'

interface ThemeState {
  tema: Tema
  definirTema: (tema: Tema) => void
}

const prefereEscuro = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export const temaEfetivo = (tema: Tema) =>
  tema === 'sistema' ? (prefereEscuro() ? 'escuro' : 'claro') : tema

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', temaEfetivo(tema) === 'escuro')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      tema: 'sistema',
      definirTema: (tema) => {
        aplicarTema(tema)
        set({ tema })
      },
    }),
    {
      name: 'brastem-tema',
      onRehydrateStorage: () => (estado) => aplicarTema(estado?.tema ?? 'sistema'),
    },
  ),
)
