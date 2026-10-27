import { create } from 'zustand'

type Verificador = () => boolean

interface AlteracoesState {
  verificadores: Map<symbol, Verificador>
  registrar: (id: symbol, verificador: Verificador) => void
  remover: (id: symbol) => void
}

/**
 * Formulários abertos dizem aqui se têm alterações não salvas; o aviso de sair sem salvar (no layout)
 * consulta antes de trocar de tela. Assim os formulários não dependem do roteador.
 */
export const useAlteracoesPendentesStore = create<AlteracoesState>((set) => ({
  verificadores: new Map(),
  registrar: (id, verificador) =>
    set((estado) => ({ verificadores: new Map(estado.verificadores).set(id, verificador) })),
  remover: (id) =>
    set((estado) => {
      const verificadores = new Map(estado.verificadores)
      verificadores.delete(id)
      return { verificadores }
    }),
}))

export const haAlteracoesPendentes = () =>
  [...useAlteracoesPendentesStore.getState().verificadores.values()].some((verificar) =>
    verificar(),
  )
