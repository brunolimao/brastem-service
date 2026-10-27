import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Tamanhos de letra, em % do padrão do navegador (todo o layout usa rem, então tudo acompanha). */
export const TAMANHOS_DE_LETRA = [87.5, 100, 112.5, 125] as const
const PADRAO = 1

export function aplicarTamanhoDeLetra(indice: number) {
  document.documentElement.style.fontSize = `${TAMANHOS_DE_LETRA[indice] ?? 100}%`
}

interface PreferenciasState {
  menuRecolhido: boolean
  alternarMenu: () => void
  /** Posição em TAMANHOS_DE_LETRA. */
  tamanhoDeLetra: number
  mudarLetra: (passo: 1 | -1) => void
}

/** Preferências de quem usa este computador (menu recolhido, tamanho da letra). */
export const usePreferenciasStore = create<PreferenciasState>()(
  persist(
    (set) => ({
      menuRecolhido: false,
      alternarMenu: () => set((estado) => ({ menuRecolhido: !estado.menuRecolhido })),
      tamanhoDeLetra: PADRAO,
      mudarLetra: (passo) =>
        set((estado) => {
          const tamanhoDeLetra = Math.min(
            Math.max(estado.tamanhoDeLetra + passo, 0),
            TAMANHOS_DE_LETRA.length - 1,
          )
          aplicarTamanhoDeLetra(tamanhoDeLetra)
          return { tamanhoDeLetra }
        }),
    }),
    {
      name: 'brastem-preferencias',
      onRehydrateStorage: () => (estado) => aplicarTamanhoDeLetra(estado?.tamanhoDeLetra ?? PADRAO),
    },
  ),
)
