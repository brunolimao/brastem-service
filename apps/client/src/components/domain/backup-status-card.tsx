import { AlertTriangle, DatabaseBackup } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useExecutarBackup } from '@/hooks/use-backup'
import { formatarDataHora, formatarHa, formatarTamanho } from '@/libs/formatters'
import type { EstadoBackup } from '@/models/backup.model'

/** Onde está a cópia mais recente, em palavras que o dono do negócio entende. */
function situacaoDaCopia(estado: EstadoBackup) {
  if (!estado.google.conectado) {
    return 'Só neste computador. Conecte o Google Drive para guardar uma cópia fora daqui.'
  }
  if (estado.pendenteDrive) return 'No computador. Aguardando o envio ao Google Drive.'
  return 'No computador e no Google Drive.'
}

export function BackupStatusCard({ estado }: { estado: EstadoBackup }) {
  const executar = useExecutarBackup()
  const ultimo = estado.ultimoBackup

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup automático</CardTitle>
        <CardDescription>
          Uma cópia do banco é feita todo dia, na primeira vez que o sistema estiver aberto.
        </CardDescription>
        <CardAction>
          <Button onClick={() => executar.mutate()} disabled={executar.isPending}>
            <DatabaseBackup /> {executar.isPending ? 'Fazendo backup...' : 'Fazer backup agora'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {estado.ultimoErro && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{estado.ultimoErro.mensagem}</AlertDescription>
          </Alert>
        )}

        {ultimo ? (
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Último backup</dt>
              <dd className="font-medium">{formatarDataHora(ultimo.criadoEm)}</dd>
              <dd className="text-muted-foreground">
                {formatarHa(ultimo.criadoEm)} ·{' '}
                {ultimo.origem === 'automatico' ? 'automático' : 'manual'} ·{' '}
                {formatarTamanho(ultimo.tamanho)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Onde está</dt>
              <dd className="font-medium">{situacaoDaCopia(estado)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Próximo automático</dt>
              <dd className="font-medium">
                {estado.proximoBackup ? formatarDataHora(estado.proximoBackup) : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">
            Ainda não foi feito nenhum backup. Clique em "Fazer backup agora" para começar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
