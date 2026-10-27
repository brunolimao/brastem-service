import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { useAppForm } from '@/components/form/form-hook'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApagarTudo } from '@/hooks/use-backup'

const confirmacaoSchema = z.object({ senha: z.string().min(1, 'Digite sua senha') })

/**
 * Começar do zero (só administrador, com a senha): o app reinicia vazio, no primeiro acesso, onde se cria
 * o administrador ou se importa o sistema antigo. O banco atual fica guardado como backup (dá para voltar).
 */
export function ApagarTudoCard() {
  const apagar = useApagarTudo()
  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState<'reiniciando' | 'reabrir' | null>(null)

  const form = useAppForm({
    defaultValues: { senha: '' },
    validators: { onChange: confirmacaoSchema },
    onSubmit: async ({ value }) => {
      const { reiniciando } = await apagar.mutateAsync(value.senha)
      setAberto(false)
      setAviso(reiniciando ? 'reiniciando' : 'reabrir')
    },
  })

  const mudarAberto = (valor: boolean) => {
    // A senha digitada não fica guardada para a próxima vez que o diálogo abrir.
    if (!valor) form.reset()
    setAberto(valor)
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-5" /> Começar do zero
        </CardTitle>
        <CardDescription>
          Apaga todos os dados para usar o sistema desde o início, por exemplo para importar de novo
          os dados do sistema antigo. Uma cópia do que existe hoje fica guardada.
        </CardDescription>
        <CardAction>
          <Button variant="destructive" onClick={() => mudarAberto(true)}>
            Apagar todos os dados
          </Button>
        </CardAction>
      </CardHeader>

      <AlertDialog open={aberto} onOpenChange={mudarAberto}>
        <AlertDialogContent>
          <form
            className="grid gap-4"
            onSubmit={(evento) => {
              evento.preventDefault()
              evento.stopPropagation()
              form.handleSubmit().catch(() => undefined)
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar todos os dados?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="grid gap-2 text-sm">
                  <p>
                    <strong>Serão apagados:</strong> clientes, aparelhos, ordens de serviço,
                    pagamentos e parcelas, receitas e despesas, os dados da empresa e{' '}
                    <strong>todos os usuários, inclusive o seu</strong>.
                  </p>
                  <p>
                    <strong>Continuam:</strong> os backups (no computador e no Google Drive) e a
                    conexão com o Google Drive.
                  </p>
                  <p>
                    <strong>Depois:</strong> o aplicativo reinicia vazio, na tela de primeiro
                    acesso, onde você cria o administrador ou pode importar os dados do sistema
                    antigo.
                  </p>
                  <p>
                    <strong>Para desfazer:</strong> o que existe hoje fica guardado como backup
                    (antes-da-restauracao) e pode ser restaurado em Configurações → Restaurar um
                    backup.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form.AppField name="senha">
              {(campo) => (
                <campo.CampoTexto
                  rotulo="Sua senha"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                />
              )}
            </form.AppField>

            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <form.Subscribe
                selector={(estado) => [estado.values.senha, estado.isSubmitting] as const}
              >
                {([senha, enviando]) => (
                  <Button type="submit" variant="destructive" disabled={!senha || enviando}>
                    {enviando ? 'Apagando...' : 'Apagar tudo'}
                  </Button>
                )}
              </form.Subscribe>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={aviso !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tudo pronto para começar do zero</AlertDialogTitle>
            <AlertDialogDescription>
              {aviso === 'reiniciando'
                ? 'O Brastem-Service está reiniciando. Em alguns segundos ele abre na tela de primeiro acesso.'
                : 'Feche e abra o Brastem-Service de novo: ele vai abrir na tela de primeiro acesso.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
