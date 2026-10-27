import type { TipoTransacao } from '@brastem/shared'
import { PagamentosCampos } from '@/components/domain/pagamentos-campos'
import { useAppForm } from '@/components/form/form-hook'
import { BarraAcoes } from '@/components/layout/barra-acoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  opcoesCategoria,
  type TransacaoForm,
  transacaoFormSchema,
  transacaoVazia,
} from '@/models/transacao.model'

interface TransacaoFormProps {
  tipo: TipoTransacao
  aoSalvar: (valores: TransacaoForm) => Promise<unknown>
  aoCancelar: () => void
}

/** Receita e despesa são o mesmo formulário; só mudam as categorias e o sinal no caixa. */
export function TransacaoFormulario({ tipo, aoSalvar, aoCancelar }: TransacaoFormProps) {
  const form = useAppForm({
    defaultValues: transacaoVazia(tipo),
    validators: { onChange: transacaoFormSchema },
    onSubmit: async ({ value }) => {
      await aoSalvar(value)
    },
  })

  return (
    <form
      className="grid gap-6"
      onSubmit={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        form.handleSubmit().catch(() => undefined)
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{tipo === 'receita' ? 'Dados da receita' : 'Dados da despesa'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <form.AppField name="descricao">
            {(campo) => <campo.CampoTexto rotulo="Descrição" className="md:col-span-2" autoFocus />}
          </form.AppField>
          <form.AppField name="valor">
            {(campo) => <campo.CampoDinheiro rotulo="Valor" />}
          </form.AppField>
          <form.AppField name="data">
            {(campo) => <campo.CampoTexto rotulo="Data" type="date" />}
          </form.AppField>
          <form.AppField name="categoria">
            {(campo) => <campo.CampoSelect rotulo="Categoria" opcoes={opcoesCategoria(tipo)} />}
          </form.AppField>
          <form.AppField name="observacao">
            {(campo) => (
              <campo.CampoTextarea rotulo="Observação" className="md:col-span-4" rows={2} />
            )}
          </form.AppField>
        </CardContent>
      </Card>

      <PagamentosCampos
        form={form}
        fields={{ pagamentos: 'pagamentos' }}
        dica="Sem pagamentos, o valor entra à vista, em dinheiro, na data informada."
      />

      <BarraAcoes>
        <Button type="button" variant="outline" onClick={aoCancelar}>
          Voltar
        </Button>
        <form.AppForm>
          <form.VigiarAlteracoes />
        </form.AppForm>
        <form.AppForm>
          <form.BotaoSalvar />
        </form.AppForm>
      </BarraAcoes>
    </form>
  )
}
