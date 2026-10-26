import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useAppForm } from '@/components/form/form-hook'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrimeiroAcesso } from '@/hooks/use-auth'
import { primeiroAcessoSchema } from '@/models/auth.model'
import { authService } from '@/services/auth.service'

export const Route = createFileRoute('/primeiro-acesso')({
  beforeLoad: async () => {
    const { needsSetup } = await authService.precisaConfigurar()
    if (!needsSetup) throw redirect({ to: '/login' })
  },
  component: PrimeiroAcessoPage,
})

function PrimeiroAcessoPage() {
  const navigate = useNavigate()
  const configurar = usePrimeiroAcesso()

  const form = useAppForm({
    defaultValues: { usuario: 'admin', senha: '', confirmarSenha: '' },
    validators: { onChange: primeiroAcessoSchema },
    onSubmit: async ({ value }) => {
      await configurar.mutateAsync({ usuario: value.usuario, senha: value.senha })
      await navigate({ to: '/login' })
    },
  })

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <img src="/logo.jpg" alt="Brastem-Service" className="h-24 object-contain" />
          <CardTitle>Primeiro acesso</CardTitle>
          <CardDescription>Crie o administrador do sistema para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(evento) => {
              evento.preventDefault()
              evento.stopPropagation()
              form.handleSubmit().catch(() => undefined)
            }}
          >
            <form.AppField name="usuario">
              {(campo) => <campo.CampoTexto rotulo="Usuário" autoComplete="username" />}
            </form.AppField>
            <form.AppField name="senha">
              {(campo) => (
                <campo.CampoTexto rotulo="Senha" type="password" autoComplete="new-password" />
              )}
            </form.AppField>
            <form.AppField name="confirmarSenha">
              {(campo) => (
                <campo.CampoTexto
                  rotulo="Repita a senha"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </form.AppField>
            <form.AppForm>
              <form.BotaoSalvar texto="Criar administrador" textoEnviando="Criando..." />
            </form.AppForm>
          </form>
          <p className="mt-4 text-center text-muted-foreground text-sm">
            Já usava o sistema antigo?{' '}
            <Link to="/importar" className="text-primary underline-offset-4 hover:underline">
              Importar os dados
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
