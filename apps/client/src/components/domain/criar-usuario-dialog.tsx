import { ROLES } from '@brastem/shared'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useAppForm } from '@/components/form/form-hook'
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

  const form = useAppForm({
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
          <form.AppField name="usuario">
            {(campo) => <campo.CampoTexto rotulo="Usuário" autoComplete="off" />}
          </form.AppField>
          <form.AppField name="senha">
            {(campo) => (
              <campo.CampoTexto rotulo="Senha" type="password" autoComplete="new-password" />
            )}
          </form.AppField>
          <form.AppField name="role">
            {(campo) => <campo.CampoSelect rotulo="Função" opcoes={opcoesRole} />}
          </form.AppField>
          <DialogFooter>
            <form.AppForm>
              <form.BotaoSalvar texto="Cadastrar" />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
