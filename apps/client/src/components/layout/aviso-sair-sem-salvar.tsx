import { useBlocker } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { haAlteracoesPendentes } from '@/hooks/use-alteracoes-pendentes'

/**
 * Antes de trocar de tela (menu, Voltar, busca rápida...), pergunta se pode descartar o que foi
 * digitado e não salvo em algum formulário (ver `VigiarAlteracoes`).
 */
export function AvisoSairSemSalvar() {
  const { status, proceed, reset } = useBlocker({
    shouldBlockFn: haAlteracoesPendentes,
    // No app desktop, segurar o fechamento da janela travaria o "fechar" sem explicação.
    enableBeforeUnload: false,
    withResolver: true,
  })

  return (
    <AlertDialog open={status === 'blocked'} onOpenChange={(aberto) => !aberto && reset?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
          <AlertDialogDescription>
            O que você alterou nesta tela ainda não foi salvo e será perdido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => reset?.()}>Continuar editando</AlertDialogCancel>
          <AlertDialogAction onClick={() => proceed?.()}>Sair sem salvar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
