import { create } from 'zustand'
import type { SessaoUsuario } from '@/models/auth.model'
import { authService } from '@/services/auth.service'

type Situacao = 'desconhecida' | 'autenticada' | 'anonima'

interface SessionState {
  situacao: Situacao
  usuario: SessaoUsuario | null
  entrar: (usuario: SessaoUsuario) => void
  sair: () => void
}

/** A sessão de verdade vive nos cookies httpOnly; aqui fica só quem está logado, para a interface. */
export const useSessionStore = create<SessionState>((set) => ({
  situacao: 'desconhecida',
  usuario: null,
  entrar: (usuario) => set({ situacao: 'autenticada', usuario }),
  sair: () => set({ situacao: 'anonima', usuario: null }),
}))

/** Descobre (uma vez) se já existe sessão válida, perguntando ao servidor. */
export async function carregarSessao() {
  if (useSessionStore.getState().situacao !== 'desconhecida') return
  try {
    useSessionStore.getState().entrar(await authService.me())
  } catch {
    useSessionStore.getState().sair()
  }
}
