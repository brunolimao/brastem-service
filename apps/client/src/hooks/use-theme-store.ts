import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { aplicarPaleta, type IdPaleta, PALETA_PADRAO, paletaPorId } from '@/libs/paletas'

export type Tema = 'claro' | 'escuro' | 'sistema'

interface ThemeState {
  tema: Tema
  paleta: IdPaleta
  definirTema: (tema: Tema) => void
  definirPaleta: (paleta: IdPaleta) => void
}

const prefereEscuro = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export const temaEfetivo = (tema: Tema) =>
  tema === 'sistema' ? (prefereEscuro() ? 'escuro' : 'claro') : tema

/** Claro/escuro e a paleta (R-UX-19): a paleta tem uma versão para cada tema. */
export function aplicarTema(tema: Tema, paleta: string = PALETA_PADRAO) {
  const escuro = temaEfetivo(tema) === 'escuro'
  document.documentElement.classList.toggle('dark', escuro)
  aplicarPaleta(paleta, escuro)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      tema: 'sistema',
      paleta: PALETA_PADRAO,
      definirTema: (tema) => {
        aplicarTema(tema, get().paleta)
        set({ tema })
      },
      definirPaleta: (paleta) => {
        aplicarTema(get().tema, paleta)
        set({ paleta })
      },
    }),
    {
      name: 'brastem-tema',
      // Paleta guardada que deixou de existir volta para a padrão.
      merge: (guardado, atual) => {
        const estado = { ...atual, ...(guardado as Partial<ThemeState>) }
        return { ...estado, paleta: paletaPorId(estado.paleta).id as IdPaleta }
      },
      onRehydrateStorage: () => (estado) =>
        aplicarTema(estado?.tema ?? 'sistema', estado?.paleta ?? PALETA_PADRAO),
    },
  ),
)
