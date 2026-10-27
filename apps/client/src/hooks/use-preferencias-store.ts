import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Tamanhos de letra, em % do padrão do navegador (todo o layout usa rem, então tudo acompanha). */
export const TAMANHOS_DE_LETRA = [87.5, 100, 112.5, 125] as const
const PADRAO = 1

/** Quantas linhas cada tabela mostra por página. */
export const OPCOES_LINHAS_POR_PAGINA = [10, 25, 50, 100] as const
export type LinhasPorPagina = (typeof OPCOES_LINHAS_POR_PAGINA)[number]

export function aplicarTamanhoDeLetra(indice: number) {
  document.documentElement.style.fontSize = `${TAMANHOS_DE_LETRA[indice] ?? 100}%`
}

interface PreferenciasState {
  menuRecolhido: boolean
  alternarMenu: () => void
  /** Posição em TAMANHOS_DE_LETRA. */
  tamanhoDeLetra: number
  definirTamanhoDeLetra: (indice: number) => void
  /** Vale para todas as tabelas (a escolha numa vale para as outras). */
  linhasPorPagina: LinhasPorPagina
  definirLinhasPorPagina: (linhas: LinhasPorPagina) => void
}

/** Preferências de quem usa este computador (menu recolhido, tamanho da letra, linhas por página). */
export const usePreferenciasStore = create<PreferenciasState>()(
  persist(
    (set) => ({
      menuRecolhido: false,
      alternarMenu: () => set((estado) => ({ menuRecolhido: !estado.menuRecolhido })),
      tamanhoDeLetra: PADRAO,
      definirTamanhoDeLetra: (indice) => {
        // Nunca fora da lista (preferência antiga, valor inválido...).
        const tamanhoDeLetra = Math.min(Math.max(indice, 0), TAMANHOS_DE_LETRA.length - 1)
        aplicarTamanhoDeLetra(tamanhoDeLetra)
        set({ tamanhoDeLetra })
      },
      linhasPorPagina: 25,
      definirLinhasPorPagina: (linhasPorPagina) => set({ linhasPorPagina }),
    }),
    {
      name: 'brastem-preferencias',
      onRehydrateStorage: () => (estado) => aplicarTamanhoDeLetra(estado?.tamanhoDeLetra ?? PADRAO),
    },
  ),
)
