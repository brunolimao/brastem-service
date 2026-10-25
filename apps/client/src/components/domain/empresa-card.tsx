import { useForm } from '@tanstack/react-form'
import { CampoTexto } from '@/components/form/campo-texto'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalvarEmpresa } from '@/hooks/use-empresa'
import { mascararCep, mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import { type Empresa, empresaFormSchema } from '@/models/empresa.model'

/** Dados do cabeçalho da OS impressa. Nada disso vem de fábrica: cada instalação preenche os seus. */
export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  const salvar = useSalvarEmpresa()
  const form = useForm({
    defaultValues: empresa,
    validators: { onChange: empresaFormSchema },
    onSubmit: async ({ value }) => {
      await salvar.mutateAsync(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da empresa</CardTitle>
        <CardDescription>
          Saem no cabeçalho da ordem de serviço impressa. Os campos em branco não aparecem no papel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-6"
          onSubmit={(evento) => {
            evento.preventDefault()
            evento.stopPropagation()
            form.handleSubmit().catch(() => undefined)
          }}
        >
          <form.Field name="nome">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="Nome da empresa"
                className="md:col-span-4"
                placeholder="Brastem-Service"
              />
            )}
          </form.Field>
          <form.Field name="cnpj">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="CNPJ"
                className="md:col-span-2"
                inputMode="numeric"
                formatar={mascararCpfCnpj}
              />
            )}
          </form.Field>
          <form.Field name="endereco">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="Endereço"
                className="md:col-span-3"
                placeholder="Rua, número, bairro, cidade e UF"
              />
            )}
          </form.Field>
          <form.Field name="cep">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="CEP"
                className="md:col-span-1"
                inputMode="numeric"
                formatar={mascararCep}
              />
            )}
          </form.Field>
          <form.Field name="telefone">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="Telefone"
                className="md:col-span-2"
                inputMode="tel"
                formatar={mascararTelefone}
              />
            )}
          </form.Field>
          <form.Subscribe selector={(estado) => estado.isSubmitting}>
            {(enviando) => (
              <Button type="submit" className="w-fit md:col-span-6" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar dados da empresa'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}
