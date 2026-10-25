import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/page-header'
import { useSessionStore } from '@/hooks/use-session-store'

export const Route = createFileRoute('/_app/')({ component: InicioPage })

function InicioPage() {
  const usuario = useSessionStore((estado) => estado.usuario)

  return (
    <PageHeader
      titulo={`Olá, ${usuario?.usuario ?? ''}`}
      descricao="Use o menu ao lado para navegar pelo sistema."
    />
  )
}
