import { createFileRoute } from '@tanstack/react-router'
import { ApagarTudoCard } from '@/components/domain/apagar-tudo-card'
import { AparenciaCard } from '@/components/domain/aparencia-card'
import { AtualizacaoCard } from '@/components/domain/atualizacao-card'
import { BackupGoogleCard } from '@/components/domain/backup-google-card'
import { BackupLista } from '@/components/domain/backup-lista'
import { BackupStatusCard } from '@/components/domain/backup-status-card'
import { DiagnosticoCard } from '@/components/domain/diagnostico-card'
import { EmpresaCard } from '@/components/domain/empresa-card'
import { ImpressaoCard } from '@/components/domain/seletor-modelo-impressao'
import { PageHeader } from '@/components/layout/page-header'
import { Secao } from '@/components/layout/secao'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoBackup } from '@/hooks/use-backup'
import { useEmpresa } from '@/hooks/use-empresa'
import { useSessionStore } from '@/hooks/use-session-store'

// Aberta a todos: o comum vê só Aparência, Impressão e Atualizações; o resto é do admin (R-CFG-09).
// Em seções, do mais importante para o menos: backup primeiro, começar do zero por último (R-CFG-11).
export const Route = createFileRoute('/_app/configuracoes')({ component: ConfiguracoesPage })

function ConfiguracoesPage() {
  const admin = useSessionStore((estado) => estado.usuario?.role === 'admin')

  return (
    <>
      <PageHeader
        titulo="Configurações"
        descricao={
          admin
            ? 'Backup, dados da empresa, aparência, impressão, atualizações e suporte.'
            : 'Aparência, impressão e atualizações do sistema neste computador.'
        }
      />
      {admin ? (
        <ConfiguracoesDoAdministrador />
      ) : (
        <>
          <NesteComputador />
          <Secao titulo="Sistema">
            <AtualizacaoCard />
          </Secao>
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
      <Secao titulo="Backup" colunas={2}>
        {estado ? (
          <>
            <BackupStatusCard estado={estado} />
            <BackupGoogleCard estado={estado} />
          </>
        ) : (
          <Skeleton className="h-64 w-full lg:col-span-2" />
        )}
        <div className="min-w-0 lg:col-span-2">
          <BackupLista />
        </div>
      </Secao>
      <Secao titulo="Empresa">
        {/* A key refaz o formulário se os dados chegarem depois. */}
        {empresa ? (
          <EmpresaCard key={JSON.stringify(empresa)} empresa={empresa} />
        ) : (
          <Skeleton className="h-48 w-full" />
        )}
      </Secao>
      <NesteComputador />
      <Secao titulo="Sistema" colunas={2}>
        <AtualizacaoCard />
        <DiagnosticoCard />
      </Secao>
      <Secao titulo="Zona de perigo">
        <ApagarTudoCard />
      </Secao>
    </>
  )
}

/** Preferências guardadas só neste computador, para todos os usuários. */
function NesteComputador() {
  return (
    <Secao titulo="Neste computador" colunas={2}>
      <AparenciaCard />
      <ImpressaoCard />
    </Secao>
  )
}
