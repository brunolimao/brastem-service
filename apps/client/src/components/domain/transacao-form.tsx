import type { TipoTransacao } from '@brastem/shared'
import { useForm } from '@tanstack/react-form'
import { PagamentosCampos } from '@/components/domain/pagamentos-campos'
import { CampoDinheiro } from '@/components/form/campo-dinheiro'
import { CampoSelect } from '@/components/form/campo-select'
import { CampoTextarea } from '@/components/form/campo-textarea'
import { CampoTexto } from '@/components/form/campo-texto'
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
  const form = useForm({
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
          <form.Field name="descricao">
            {(campo) => (
              <CampoTexto campo={campo} rotulo="Descrição" className="md:col-span-2" autoFocus />
            )}
          </form.Field>
          <form.Field name="valor">
            {(campo) => <CampoDinheiro campo={campo} rotulo="Valor" />}
          </form.Field>
          <form.Field name="data">
            {(campo) => <CampoTexto campo={campo} rotulo="Data" type="date" />}
          </form.Field>
          <form.Field name="categoria">
            {(campo) => (
              <CampoSelect campo={campo} rotulo="Categoria" opcoes={opcoesCategoria(tipo)} />
            )}
          </form.Field>
          <form.Field name="observacao">
            {(campo) => (
              <CampoTextarea campo={campo} rotulo="Observação" className="md:col-span-4" rows={2} />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <PagamentosCampos
        form={form}
        dica="Sem pagamentos, o valor entra à vista, em dinheiro, na data informada."
      />

      <BarraAcoes>
        <Button type="button" variant="outline" onClick={aoCancelar}>
          Voltar
        </Button>
        <form.Subscribe selector={(estado) => estado.isSubmitting}>
          {(enviando) => (
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </form.Subscribe>
      </BarraAcoes>
    </form>
  )
}
