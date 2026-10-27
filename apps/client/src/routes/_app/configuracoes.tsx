import { createFileRoute } from '@tanstack/react-router'
import { ApagarTudoCard } from '@/components/domain/apagar-tudo-card'
import { AparenciaCard } from '@/components/domain/aparencia-card'
import { AtualizacaoCard } from '@/components/domain/atualizacao-card'
import { BackupGoogleCard } from '@/components/domain/backup-google-card'
import { BackupLista } from '@/components/domain/backup-lista'
import { BackupStatusCard } from '@/components/domain/backup-status-card'
import { EmpresaCard } from '@/components/domain/empresa-card'
import { PageHeader } from '@/components/layout/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoBackup } from '@/hooks/use-backup'
import { useEmpresa } from '@/hooks/use-empresa'
import { useSessionStore } from '@/hooks/use-session-store'

// Aberta a todos: o usuário comum vê só Aparência e Atualizações; o resto é do administrador (R-CFG-09).
export const Route = createFileRoute('/_app/configuracoes')({ component: ConfiguracoesPage })

function ConfiguracoesPage() {
  const admin = useSessionStore((estado) => estado.usuario?.role === 'admin')

  return (
    <>
      <PageHeader
        titulo="Configurações"
        descricao={
          admin
            ? 'Dados da empresa, aparência, atualizações, backup, restauração e começar do zero.'
            : 'Aparência e atualizações do sistema neste computador.'
        }
      />
      {admin ? (
        <ConfiguracoesDoAdministrador />
      ) : (
        <>
          <AparenciaCard />
          <AtualizacaoCard />
        </>
      )}
    </>
  )
}

/** Só montado para o administrador: nem as consultas de empresa e backup acontecem para os outros. */
function ConfiguracoesDoAdministrador() {
  const { data: estado } = useEstadoBackup()
  const { data: empresa } = useEmpresa()

  return (
    <>
      {/* A key refaz o formulário se os dados chegarem depois. */}
      {empresa && <EmpresaCard key={JSON.stringify(empresa)} empresa={empresa} />}
      <AparenciaCard />
      <AtualizacaoCard />
      {estado ? (
        <>
          <BackupStatusCard estado={estado} />
          <BackupGoogleCard estado={estado} />
          <BackupLista />
        </>
      ) : (
        <Skeleton className="h-96 w-full" />
      )}
      <ApagarTudoCard />
    </>
  )
}
