import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { CampoTexto } from '@/components/form/campo-texto'
import { Button } from '@/components/ui/button'
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

  const form = useForm({
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
            <form.Field name="usuario">
              {(campo) => (
                <CampoTexto campo={campo} rotulo="Usuário" autoComplete="username" autoFocus />
              )}
            </form.Field>
            <form.Field name="senha">
              {(campo) => (
                <CampoTexto
                  campo={campo}
                  rotulo="Senha"
                  type="password"
                  autoComplete="current-password"
                />
              )}
            </form.Field>
            <form.Subscribe selector={(estado) => estado.isSubmitting}>
              {(enviando) => (
                <Button type="submit" disabled={enviando}>
                  {enviando ? 'Entrando...' : 'Entrar'}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
