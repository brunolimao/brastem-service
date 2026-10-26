import { CheckCircle2, ExternalLink, Unplug } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAppForm } from '@/components/form/form-hook'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useDesconectarGoogle,
  useEstadoBackup,
  useSalvarCredenciaisGoogle,
} from '@/hooks/use-backup'
import { credenciaisGoogleSchema, type EstadoBackup } from '@/models/backup.model'
import { backupService } from '@/services/backup.service'

/** Quanto tempo esperamos o usuário concluir a autorização no navegador antes de parar de perguntar. */
const ESPERA_MAXIMA_MS = 5 * 60 * 1000

function FormularioCredenciais({ aoSalvar }: { aoSalvar: () => void }) {
  const salvar = useSalvarCredenciaisGoogle()
  const form = useAppForm({
    defaultValues: { clientId: '', clientSecret: '' },
    validators: { onChange: credenciaisGoogleSchema },
    onSubmit: async ({ value }) => {
      await salvar.mutateAsync(value)
      aoSalvar()
    },
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        form.handleSubmit().catch(() => undefined)
      }}
    >
      <p className="text-muted-foreground text-sm">
        Para guardar os backups no seu Google Drive, o sistema precisa de um "app" criado no Google
        Cloud (grátis, é feito uma vez). O passo a passo está no arquivo{' '}
        <code className="rounded bg-muted px-1 py-0.5">docs/backup-google-drive.md</code>.
      </p>
      <form.AppField name="clientId">
        {(campo) => <campo.CampoTexto rotulo="ID do cliente (Client ID)" autoComplete="off" />}
      </form.AppField>
      <form.AppField name="clientSecret">
        {(campo) => (
          <campo.CampoTexto
            rotulo="Chave secreta do cliente (Client Secret)"
            type="password"
            autoComplete="off"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.BotaoSalvar texto="Salvar credenciais" className="w-fit" />
      </form.AppForm>
    </form>
  )
}

export function BackupGoogleCard({ estado }: { estado: EstadoBackup }) {
  const { google } = estado
  const [aguardando, setAguardando] = useState(false)
  const [editandoCredenciais, setEditandoCredenciais] = useState(false)
  const desconectar = useDesconectarGoogle()
  // Enquanto o usuário autoriza no navegador, perguntamos o estado de 2 em 2 segundos.
  useEstadoBackup(aguardando)

  useEffect(() => {
    if (!aguardando) return
    if (google.conectado) {
      setAguardando(false)
      toast.success('Google Drive conectado')
      return
    }
    const desistir = setTimeout(() => setAguardando(false), ESPERA_MAXIMA_MS)
    return () => clearTimeout(desistir)
  }, [aguardando, google.conectado])

  const conectar = async () => {
    const { url } = await backupService.urlDeConexao()
    // Abre no navegador do sistema: o Google não permite o login dentro de janelas embutidas.
    window.open(url, '_blank', 'noopener')
    setAguardando(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Drive</CardTitle>
        <CardDescription>
          Uma cópia dos backups fica numa pasta "Brastem-Service Backups" na sua conta. O sistema só
          enxerga os arquivos que ele mesmo cria, nunca o resto do seu Drive.
        </CardDescription>
        <CardAction>
          {google.conectado ? (
            <Badge className="gap-1">
              <CheckCircle2 className="size-3" /> Conectado
            </Badge>
          ) : (
            <Badge variant="secondary">Não conectado</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!google.configurado || editandoCredenciais ? (
          <FormularioCredenciais aoSalvar={() => setEditandoCredenciais(false)} />
        ) : google.conectado ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Conta: <strong>{google.email ?? 'conectada'}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => desconectar.mutate()}
              disabled={desconectar.isPending}
            >
              <Unplug /> Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={conectar} disabled={aguardando}>
              <ExternalLink />{' '}
              {aguardando ? 'Aguardando você autorizar...' : 'Conectar ao Google Drive'}
            </Button>
            {aguardando && (
              <p className="text-muted-foreground text-sm">
                Conclua a autorização na janela do navegador que abriu.
              </p>
            )}
          </div>
        )}

        {google.configurado && google.origemCredenciais === 'app' && !editandoCredenciais && (
          <Button
            variant="link"
            className="h-auto w-fit p-0 text-muted-foreground text-xs"
            onClick={() => setEditandoCredenciais(true)}
          >
            Trocar credenciais do Google
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
