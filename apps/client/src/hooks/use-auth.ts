import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { LoginInput } from '@/models/auth.model'
import { authService } from '@/services/auth.service'
import { useSessionStore } from './use-session-store'

export function useLogin() {
  const entrar = useSessionStore((estado) => estado.entrar)
  return useMutation({
    mutationFn: (dados: LoginInput) => authService.login(dados),
    onSuccess: (usuario) => entrar(usuario),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const sair = useSessionStore((estado) => estado.sair)
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      sair()
      queryClient.clear()
    },
  })
}

export function usePrimeiroAcesso() {
  return useMutation({
    mutationFn: authService.configurar,
    onSuccess: () => toast.success('Administrador criado. Agora é só entrar.'),
  })
}
