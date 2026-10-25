import { ROLES } from '@brastem/shared'
import { useForm } from '@tanstack/react-form'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CampoSelect } from '@/components/form/campo-select'
import { CampoTexto } from '@/components/form/campo-texto'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCriarUsuario } from '@/hooks/use-usuarios'
import { criarUsuarioSchema, ROTULO_ROLE } from '@/models/usuario.model'

const opcoesRole = ROLES.map((role) => ({ valor: role, rotulo: ROTULO_ROLE[role] }))

export function CriarUsuarioDialog() {
  const [aberto, setAberto] = useState(false)
  const criar = useCriarUsuario()

  const form = useForm({
    defaultValues: { usuario: '', senha: '', role: 'usuario' as (typeof ROLES)[number] },
    validators: { onChange: criarUsuarioSchema },
    onSubmit: async ({ value, formApi }) => {
      await criar.mutateAsync(value)
      formApi.reset()
      setAberto(false)
    },
  })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Cadastrar usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Quem entra no sistema e o que pode fazer.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            evento.stopPropagation()
            form.handleSubmit().catch(() => undefined)
          }}
        >
          <form.Field name="usuario">
            {(campo) => <CampoTexto campo={campo} rotulo="Usuário" autoComplete="off" />}
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
          <form.Field name="role">
            {(campo) => <CampoSelect campo={campo} rotulo="Função" opcoes={opcoesRole} />}
          </form.Field>
          <DialogFooter>
            <form.Subscribe selector={(estado) => estado.isSubmitting}>
              {(enviando) => (
                <Button type="submit" disabled={enviando}>
                  {enviando ? 'Salvando...' : 'Cadastrar'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
