import { useAppForm } from '@/components/form/form-hook'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalvarEmpresa } from '@/hooks/use-empresa'
import { mascararCep, mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import { type Empresa, empresaFormSchema } from '@/models/empresa.model'

/** Dados do cabeçalho da OS impressa. Nada disso vem de fábrica: cada instalação preenche os seus. */
export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  const salvar = useSalvarEmpresa()
  const form = useAppForm({
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
          <form.AppField name="nome">
            {(campo) => (
              <campo.CampoTexto
                rotulo="Nome da empresa"
                className="md:col-span-4"
                placeholder="Brastem-Service"
              />
            )}
          </form.AppField>
          <form.AppField name="cnpj">
            {(campo) => (
              <campo.CampoTexto
                rotulo="CNPJ"
                className="md:col-span-2"
                inputMode="numeric"
                formatar={mascararCpfCnpj}
              />
            )}
          </form.AppField>
          <form.AppField name="endereco">
            {(campo) => (
              <campo.CampoTexto
                rotulo="Endereço"
                className="md:col-span-3"
                placeholder="Rua, número, bairro, cidade e UF"
              />
            )}
          </form.AppField>
          <form.AppField name="cep">
            {(campo) => (
              <campo.CampoTexto
                rotulo="CEP"
                className="md:col-span-1"
                inputMode="numeric"
                formatar={mascararCep}
              />
            )}
          </form.AppField>
          <form.AppField name="telefone">
            {(campo) => (
              <campo.CampoTexto
                rotulo="Telefone"
                className="md:col-span-2"
                inputMode="tel"
                formatar={mascararTelefone}
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.VigiarAlteracoes />
          </form.AppForm>
          <form.AppForm>
            <form.BotaoSalvar texto="Salvar dados da empresa" className="w-fit md:col-span-6" />
          </form.AppForm>
        </form>
      </CardContent>
    </Card>
  )
}
