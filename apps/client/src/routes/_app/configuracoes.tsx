import { createFileRoute, redirect } from '@tanstack/react-router'
import { BackupGoogleCard } from '@/components/domain/backup-google-card'
import { BackupLista } from '@/components/domain/backup-lista'
import { BackupStatusCard } from '@/components/domain/backup-status-card'
import { EmpresaCard } from '@/components/domain/empresa-card'
import { PageHeader } from '@/components/layout/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoBackup } from '@/hooks/use-backup'
import { useEmpresa } from '@/hooks/use-empresa'
import { useSessionStore } from '@/hooks/use-session-store'

export const Route = createFileRoute('/_app/configuracoes')({
  beforeLoad: () => {
    if (useSessionStore.getState().usuario?.role !== 'admin') throw redirect({ to: '/' })
  },
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  const { data: estado } = useEstadoBackup()
  const { data: empresa } = useEmpresa()

  return (
    <>
      <PageHeader titulo="Configurações" descricao="Dados da empresa, backup e restauração." />
      {/* A key refaz o formulário se os dados chegarem depois. */}
      {empresa && <EmpresaCard key={JSON.stringify(empresa)} empresa={empresa} />}
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
