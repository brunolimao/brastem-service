import { useForm } from '@tanstack/react-form'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { CampoTexto } from '@/components/form/campo-texto'
import { Button } from '@/components/ui/button'
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

  const form = useForm({
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
            <form.Field name="usuario">
              {(campo) => <CampoTexto campo={campo} rotulo="Usuário" autoComplete="username" />}
            </form.Field>
            <form.Field name="senha">
              {(campo) => (
                <CampoTexto
                  campo={campo}
                  rotulo="Senha"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>
            <form.Field name="confirmarSenha">
              {(campo) => (
                <CampoTexto
                  campo={campo}
                  rotulo="Repita a senha"
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>
            <form.Subscribe selector={(estado) => estado.isSubmitting}>
              {(enviando) => (
                <Button type="submit" disabled={enviando}>
                  {enviando ? 'Criando...' : 'Criar administrador'}
                </Button>
              )}
            </form.Subscribe>
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
