import { createFileRoute, redirect } from '@tanstack/react-router'
import { BackupGoogleCard } from '@/components/domain/backup-google-card'
import { BackupLista } from '@/components/domain/backup-lista'
import { BackupStatusCard } from '@/components/domain/backup-status-card'
import { PageHeader } from '@/components/layout/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoBackup } from '@/hooks/use-backup'
import { useSessionStore } from '@/hooks/use-session-store'

export const Route = createFileRoute('/_app/configuracoes')({
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  const { data: estado } = useEstadoBackup()

  return (
    <>
      <PageHeader titulo="Configurações" descricao="Backup e restauração dos dados do sistema." />
      {estado ? (
        <>
          <BackupStatusCard estado={estado} />
          <BackupGoogleCard estado={estado} />
          <BackupLista />
        </>
      ) : (
        <Skeleton className="h-96 w-full" />
      )}
    </>
  )
}
