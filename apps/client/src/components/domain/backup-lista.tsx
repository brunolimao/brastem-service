import { FileUp, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { type Coluna, DataTable } from '@/components/data-table/data-table'
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
import { useArquivosBackup, useRestaurarBackup } from '@/hooks/use-backup'
import { formatarDataHora, formatarTamanho } from '@/libs/formatters'
import { type BackupDisponivel, juntarBackups } from '@/models/backup.model'

const SEM_DADOS: BackupDisponivel[] = []

/** O que vai ser restaurado: um backup da lista ou um arquivo escolhido no computador. */
type Escolha = { backup: BackupDisponivel } | { arquivo: File }

export function BackupLista() {
  const { data, isLoading } = useArquivosBackup()
  const restaurar = useRestaurarBackup()
  const [escolha, setEscolha] = useState<Escolha | null>(null)
  const seletor = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<'reiniciando' | 'reabrir' | null>(null)

  const colunas: Coluna<BackupDisponivel>[] = [
    {
      accessorKey: 'origem',
      header: 'Onde está',
      cell: ({ row }) => (
        <Badge variant={row.original.origem === 'drive' ? 'default' : 'secondary'}>
          {row.original.origem === 'drive' ? 'Google Drive' : 'Computador'}
        </Badge>
      ),
    },
    {
      accessorKey: 'criadoEm',
      header: 'Data',
      cell: ({ row }) => formatarDataHora(row.original.criadoEm),
    },
    { accessorKey: 'nome', header: 'Arquivo' },
    {
      accessorKey: 'tamanho',
      header: 'Tamanho',
      cell: ({ row }) => formatarTamanho(row.original.tamanho),
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setEscolha({ backup: row.original })}>
            <RotateCcw /> Restaurar
          </Button>
        </div>
      ),
    },
  ]

  const confirmar = async () => {
    if (!escolha) return
    const { reiniciando } = await restaurar.mutateAsync(
      'arquivo' in escolha
        ? { arquivo: escolha.arquivo }
        : { origem: escolha.backup.origem, id: escolha.backup.id },
    )
    setEscolha(null)
    setAviso(reiniciando ? 'reiniciando' : 'reabrir')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurar um backup</CardTitle>
        <CardDescription>
          Escolha uma data para voltar o sistema àquele ponto. Use só se algo deu errado ou os dados
          foram perdidos. Tem o arquivo de um backup guardado (pendrive, baixado do Drive)? Use
          "Restaurar de um arquivo".
        </CardDescription>
        <CardAction>
          <input
            ref={seletor}
            type="file"
            accept=".gz,.sqlite"
            className="sr-only"
            aria-label="Arquivo de backup"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0]
              // Limpa o seletor: escolher o mesmo arquivo de novo também precisa abrir a confirmação.
              evento.target.value = ''
              if (arquivo) setEscolha({ arquivo })
            }}
          />
          <Button variant="outline" onClick={() => seletor.current?.click()}>
            <FileUp /> Restaurar de um arquivo
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {data?.erroDrive && (
          <p className="text-destructive text-sm">
            Não consegui listar os backups do Google Drive agora: {data.erroDrive}
          </p>
        )}
        <DataTable
          colunas={colunas}
          dados={data ? juntarBackups(data) : SEM_DADOS}
          carregando={isLoading}
          mensagemVazia="Nenhum backup ainda"
        />
      </CardContent>

      <AlertDialog open={escolha !== null} onOpenChange={(aberto) => !aberto && setEscolha(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar este backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {escolha && 'arquivo' in escolha ? (
                <>
                  O sistema volta ao estado do arquivo <strong>{escolha.arquivo.name}</strong>.
                </>
              ) : (
                <>
                  O sistema volta ao estado de{' '}
                  <strong>{escolha ? formatarDataHora(escolha.backup.criadoEm) : ''}</strong>.
                </>
              )}{' '}
              Tudo o que foi feito depois desse backup será perdido. Uma cópia do banco atual fica
              guardada no computador, e o aplicativo será reiniciado. Arquivo que não for um backup
              do Brastem-Service é recusado, sem mexer em nada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                evento.preventDefault()
                void confirmar()
              }}
              disabled={restaurar.isPending}
            >
              {restaurar.isPending ? 'Preparando...' : 'Restaurar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={aviso !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restauração preparada</AlertDialogTitle>
            <AlertDialogDescription>
              {aviso === 'reiniciando'
                ? 'O Brastem-Service está reiniciando para aplicar o backup. Aguarde alguns segundos.'
                : 'Feche e abra o Brastem-Service de novo para aplicar o backup.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
