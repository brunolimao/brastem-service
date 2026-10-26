import { Plus, Trash2 } from 'lucide-react'
import { withFieldGroup } from '@/components/form/form-hook'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  OPCOES_PARCELAS,
  OPCOES_TIPO_PAGAMENTO,
  type PagamentoForm,
  pagamentoVazio,
} from '@/models/pagamento.model'

/**
 * Lista de pagamentos (valor, forma, parcelas, data) usada nas OS e nos lançamentos.
 * É um grupo de campos: serve para qualquer formulário que tenha uma lista de `PagamentoForm`,
 * com tipagem completa (o nome de cada campo é conferido pelo TypeScript).
 *
 *   <PagamentosCampos form={form} fields={{ pagamentos: 'pagamentos' }} />
 */
export const PagamentosCampos = withFieldGroup({
  defaultValues: { pagamentos: [] as PagamentoForm[] },
  props: {} as { dica?: string },
  render: function Render({ group, dica }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
          <CardAction>
            <group.Field name="pagamentos" mode="array">
              {(lista) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => lista.pushValue(pagamentoVazio())}
                >
                  <Plus /> Adicionar pagamento
                </Button>
              )}
            </group.Field>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <group.Field name="pagamentos" mode="array">
            {(lista) =>
              lista.state.value.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum pagamento lançado.</p>
              ) : (
                lista.state.value.map((pagamento, indice) => (
                  <div
                    key={pagamento.chave}
                    className="grid items-start gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_8rem_1fr_auto]"
                  >
                    <group.AppField name={`pagamentos[${indice}].valor`}>
                      {(campo) => <campo.CampoDinheiro rotulo="Valor" />}
                    </group.AppField>
                    <group.AppField name={`pagamentos[${indice}].tipo`}>
                      {(campo) => (
                        <campo.CampoSelect rotulo="Forma" opcoes={OPCOES_TIPO_PAGAMENTO} />
                      )}
                    </group.AppField>
                    <group.AppField name={`pagamentos[${indice}].parcelas`}>
                      {(campo) => <campo.CampoSelect rotulo="Parcelas" opcoes={OPCOES_PARCELAS} />}
                    </group.AppField>
                    <group.AppField name={`pagamentos[${indice}].data`}>
                      {(campo) => <campo.CampoTexto rotulo="Data" type="date" />}
                    </group.AppField>
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
                    <group.AppField name={`pagamentos[${indice}].observacao`}>
                      {(campo) => (
                        <campo.CampoTexto rotulo="Observação" className="md:col-span-5" />
                      )}
                    </group.AppField>
                  </div>
                ))
              )
            }
          </group.Field>
          <p className="text-muted-foreground text-xs">
            Parcelado: a primeira parcela cai um mês depois da data informada.
            {dica && ` ${dica}`}
          </p>
        </CardContent>
      </Card>
    )
  },
})
