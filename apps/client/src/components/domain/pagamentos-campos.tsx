import type { AnyFieldApi } from '@tanstack/react-form'
import { Plus, Trash2 } from 'lucide-react'
import { CampoDinheiro } from '@/components/form/campo-dinheiro'
import { CampoSelect } from '@/components/form/campo-select'
import { CampoTexto } from '@/components/form/campo-texto'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  OPCOES_PARCELAS,
  OPCOES_TIPO_PAGAMENTO,
  type PagamentoForm,
  pagamentoVazio,
} from '@/models/pagamento.model'

// Os formulários tipam o `form` pelos próprios valores, que não se encaixam num tipo comum;
// o contrato é só ter o campo `pagamentos`.
// biome-ignore lint/suspicious/noExplicitAny: ver comentário acima
type FormularioQualquer = any

interface PagamentosCamposProps {
  /** Formulário que tenha o campo `pagamentos` (lista de `PagamentoForm`). */
  form: FormularioQualquer
  dica?: string
}

/** Lista de pagamentos (valor, forma, parcelas, data) usada nas OS e nos lançamentos. */
export function PagamentosCampos({ form, dica }: PagamentosCamposProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos</CardTitle>
        <CardAction>
          <form.Field name="pagamentos" mode="array">
            {(campo: AnyFieldApi) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => campo.pushValue(pagamentoVazio())}
              >
                <Plus /> Adicionar pagamento
              </Button>
            )}
          </form.Field>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <form.Field name="pagamentos" mode="array">
          {(lista: AnyFieldApi) =>
            lista.state.value.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum pagamento lançado.</p>
            ) : (
              (lista.state.value as PagamentoForm[]).map((pagamento, indice) => (
                <div
                  key={pagamento.chave}
                  className="grid items-start gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_8rem_1fr_auto]"
                >
                  <form.Field name={`pagamentos[${indice}].valor`}>
                    {(campo: AnyFieldApi) => <CampoDinheiro campo={campo} rotulo="Valor" />}
                  </form.Field>
                  <form.Field name={`pagamentos[${indice}].tipo`}>
                    {(campo: AnyFieldApi) => (
                      <CampoSelect campo={campo} rotulo="Forma" opcoes={OPCOES_TIPO_PAGAMENTO} />
                    )}
                  </form.Field>
                  <form.Field name={`pagamentos[${indice}].parcelas`}>
                    {(campo: AnyFieldApi) => (
                      <CampoSelect campo={campo} rotulo="Parcelas" opcoes={OPCOES_PARCELAS} />
                    )}
                  </form.Field>
                  <form.Field name={`pagamentos[${indice}].data`}>
                    {(campo: AnyFieldApi) => <CampoTexto campo={campo} rotulo="Data" type="date" />}
                  </form.Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    aria-label={`Remover pagamento ${indice + 1}`}
                    onClick={() => lista.removeValue(indice)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                  <form.Field name={`pagamentos[${indice}].observacao`}>
                    {(campo: AnyFieldApi) => (
                      <CampoTexto campo={campo} rotulo="Observação" className="md:col-span-5" />
                    )}
                  </form.Field>
                </div>
              ))
            )
          }
        </form.Field>
        <p className="text-muted-foreground text-xs">
          Parcelado: a primeira parcela cai um mês depois da data informada.
          {dica && ` ${dica}`}
        </p>
      </CardContent>
    </Card>
  )
}
