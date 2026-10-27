import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { CheckCircle2, FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/auth.service'
import { backupService } from '@/services/backup.service'

/** Primeiro acesso: em vez de criar o administrador, volta um backup do próprio Brastem-Service. */
export const Route = createFileRoute('/restaurar-backup')({
  beforeLoad: async () => {
    const { needsSetup } = await authService.precisaConfigurar()
    if (!needsSetup) throw redirect({ to: '/login' })
  },
  component: RestaurarBackupPage,
})

function RestaurarBackupPage() {
  const seletor = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const restaurar = useMutation({ mutationFn: backupService.restaurarInicial })

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center gap-3 text-center">
          <img src="/logo.jpg" alt="Brastem-Service" className="h-24 object-contain" />
          <CardTitle>Restaurar um backup</CardTitle>
          <CardDescription>
            Escolha um backup do Brastem-Service (<strong>.sqlite.gz</strong>, como os do Google
            Drive, ou <strong>.sqlite</strong>). Os dados e os usuários dele voltam, e você entra
            com o seu usuário de sempre. O arquivo <strong>.sql</strong> do sistema antigo vai em
            "Importar os dados".
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {restaurar.data ? (
            <div className="grid gap-2 text-center">
              <p className="flex items-center justify-center gap-2 font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-5" /> Backup pronto para entrar
              </p>
              <p className="text-muted-foreground text-sm">
                {restaurar.data.reiniciando
                  ? 'O Brastem-Service está reiniciando com os dados do backup. Aguarde alguns segundos.'
                  : 'Feche e abra o Brastem-Service de novo para usar os dados do backup.'}
              </p>
            </div>
          ) : (
            <>
              <input
                ref={seletor}
                type="file"
                accept=".gz,.sqlite"
                className="sr-only"
                aria-label="Arquivo de backup"
                onChange={(evento) => {
                  setArquivo(evento.target.files?.[0] ?? null)
                  evento.target.value = ''
                }}
              />
              <Button type="button" variant="outline" onClick={() => seletor.current?.click()}>
                <FileUp /> {arquivo ? arquivo.name : 'Escolher arquivo'}
              </Button>
              <div className="flex justify-between gap-2">
                <Button asChild variant="ghost">
                  <Link to="/primeiro-acesso">Voltar</Link>
                </Button>
                <Button
                  disabled={!arquivo || restaurar.isPending}
                  onClick={() => arquivo && restaurar.mutate(arquivo)}
                >
                  {restaurar.isPending ? 'Restaurando...' : 'Restaurar'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
