import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { useAppForm } from '@/components/form/form-hook'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useLogin } from '@/hooks/use-auth'
import { carregarSessao, useSessionStore } from '@/hooks/use-session-store'
import { loginSchema } from '@/models/auth.model'
import { authService } from '@/services/auth.service'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async () => {
    await carregarSessao()
    if (useSessionStore.getState().situacao === 'autenticada') throw redirect({ to: '/' })
    const { needsSetup } = await authService.precisaConfigurar()
    if (needsSetup) throw redirect({ to: '/primeiro-acesso' })
  },
  component: LoginPage,
})

/** Só aceita caminhos internos, para o login não virar redirecionamento aberto. */
const destinoSeguro = (destino: string | undefined) =>
  destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/'

function LoginPage() {
  const { redirect: destino } = Route.useSearch()
  const router = useRouter()
  const login = useLogin()

  const form = useAppForm({
    defaultValues: { usuario: '', senha: '' },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      await login.mutateAsync(value)
      router.history.push(destinoSeguro(destino))
    },
  })

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <img src="/logo.jpg" alt="Brastem-Service" className="h-28 object-contain" />
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
              {(campo) => <campo.CampoTexto rotulo="Usuário" autoComplete="username" autoFocus />}
            </form.AppField>
            <form.AppField name="senha">
              {(campo) => (
                <campo.CampoTexto rotulo="Senha" type="password" autoComplete="current-password" />
              )}
            </form.AppField>
            <form.AppForm>
              <form.BotaoSalvar texto="Entrar" textoEnviando="Entrando..." />
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
