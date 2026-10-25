import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useArquivosBackup, useRestaurarBackup } from '@/hooks/use-backup'
import { formatarDataHora, formatarTamanho } from '@/libs/formatters'
import { type BackupDisponivel, juntarBackups } from '@/models/backup.model'

const SEM_DADOS: BackupDisponivel[] = []

export function BackupLista() {
  const { data, isLoading } = useArquivosBackup()
  const restaurar = useRestaurarBackup()
  const [escolhido, setEscolhido] = useState<BackupDisponivel | null>(null)
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
          <Button variant="outline" size="sm" onClick={() => setEscolhido(row.original)}>
            <RotateCcw /> Restaurar
          </Button>
        </div>
      ),
    },
  ]

  const confirmar = async () => {
    if (!escolhido) return
    const { reiniciando } = await restaurar.mutateAsync({
      origem: escolhido.origem,
      id: escolhido.id,
    })
    setEscolhido(null)
    setAviso(reiniciando ? 'reiniciando' : 'reabrir')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurar um backup</CardTitle>
        <CardDescription>
          Escolha uma data para voltar o sistema àquele ponto. Use só se algo deu errado ou os dados
          foram perdidos.
        </CardDescription>
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

      <AlertDialog
        open={escolhido !== null}
        onOpenChange={(aberto) => !aberto && setEscolhido(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar este backup?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema volta ao estado de{' '}
              <strong>{escolhido ? formatarDataHora(escolhido.criadoEm) : ''}</strong>. Tudo o que
              foi feito depois dessa data será perdido. Uma cópia do banco atual fica guardada no
              computador, e o aplicativo será reiniciado.
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
