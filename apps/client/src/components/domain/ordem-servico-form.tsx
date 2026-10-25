import { useForm } from '@tanstack/react-form'
import { Plus, Trash2 } from 'lucide-react'
import { CampoCheckbox } from '@/components/form/campo-checkbox'
import { CampoDinheiro } from '@/components/form/campo-dinheiro'
import { CampoSelect } from '@/components/form/campo-select'
import { CampoTextarea } from '@/components/form/campo-textarea'
import { CampoTexto } from '@/components/form/campo-texto'
import { BarraAcoes } from '@/components/layout/barra-acoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  mostrarPagamentos,
  OPCOES_STATUS,
  type OrdemServicoForm,
  ordemServicoFormSchema,
} from '@/models/ordem-servico.model'
import { OPCOES_PARCELAS, OPCOES_TIPO_PAGAMENTO, pagamentoVazio } from '@/models/pagamento.model'

interface OrdemServicoFormProps {
  valoresIniciais: OrdemServicoForm
  aoSalvar: (valores: OrdemServicoForm) => Promise<unknown>
  aoCancelar: () => void
}

export function OrdemServicoFormulario({
  valoresIniciais,
  aoSalvar,
  aoCancelar,
}: OrdemServicoFormProps) {
  const form = useForm({
    defaultValues: valoresIniciais,
    validators: { onChange: ordemServicoFormSchema },
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
          <CardTitle>Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <form.Field name="abertura">
            {(campo) => <CampoTexto campo={campo} rotulo="Data de abertura" type="date" />}
          </form.Field>
          <form.Field name="status">
            {(campo) => <CampoSelect campo={campo} rotulo="Status" opcoes={OPCOES_STATUS} />}
          </form.Field>
          <form.Field name="valor">
            {(campo) => <CampoDinheiro campo={campo} rotulo="Valor" />}
          </form.Field>
          <form.Field name="taxaDeslocamento">
            {(campo) => <CampoDinheiro campo={campo} rotulo="Taxa de deslocamento" />}
          </form.Field>
          <form.Field name="isGarantia">
            {(campo) => (
              <CampoCheckbox
                campo={campo}
                rotulo="Atendimento em garantia"
                className="md:col-span-4"
              />
            )}
          </form.Field>
          <form.Field name="relatado">
            {(campo) => (
              <CampoTextarea
                campo={campo}
                rotulo="Problema relatado"
                className="md:col-span-2"
                rows={3}
              />
            )}
          </form.Field>
          <form.Field name="identificado">
            {(campo) => (
              <CampoTextarea
                campo={campo}
                rotulo="Problema identificado"
                className="md:col-span-2"
                rows={3}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(estado) => estado.values.status === 'FECHADO'}>
            {(fechada) =>
              fechada && (
                <>
                  <form.Field name="solucionado">
                    {(campo) => (
                      <CampoTextarea
                        campo={campo}
                        rotulo="Problema solucionado"
                        className="md:col-span-2"
                        rows={3}
                      />
                    )}
                  </form.Field>
                  <form.Field name="fechamento">
                    {(campo) => <CampoTexto campo={campo} rotulo="Fechado em" type="date" />}
                  </form.Field>
                  <form.Field name="garantiaDias">
                    {(campo) => (
                      <CampoTexto
                        campo={campo}
                        rotulo="Garantia (dias)"
                        inputMode="numeric"
                        formatar={(valor) => valor.replace(/\D/g, '')}
                      />
                    )}
                  </form.Field>
                </>
              )
            }
          </form.Subscribe>

          <form.Field name="observacao">
            {(campo) => (
              <CampoTextarea campo={campo} rotulo="Observação" className="md:col-span-4" rows={2} />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <form.Subscribe selector={(estado) => mostrarPagamentos(estado.values)}>
        {(visivel) =>
          visivel && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Pagamentos</CardTitle>
                <form.Field name="pagamentos" mode="array">
                  {(campo) => (
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
              </CardHeader>
              <CardContent className="grid gap-3">
                <form.Field name="pagamentos" mode="array">
                  {(lista) =>
                    lista.state.value.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhum pagamento lançado.</p>
                    ) : (
                      lista.state.value.map((pagamento, indice) => (
                        <div
                          key={pagamento.chave}
                          className="grid items-start gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_8rem_1fr_auto]"
                        >
                          <form.Field name={`pagamentos[${indice}].valor`}>
                            {(campo) => <CampoDinheiro campo={campo} rotulo="Valor" />}
                          </form.Field>
                          <form.Field name={`pagamentos[${indice}].tipo`}>
                            {(campo) => (
                              <CampoSelect
                                campo={campo}
                                rotulo="Forma"
                                opcoes={OPCOES_TIPO_PAGAMENTO}
                              />
                            )}
                          </form.Field>
                          <form.Field name={`pagamentos[${indice}].parcelas`}>
                            {(campo) => (
                              <CampoSelect
                                campo={campo}
                                rotulo="Parcelas"
                                opcoes={OPCOES_PARCELAS}
                              />
                            )}
                          </form.Field>
                          <form.Field name={`pagamentos[${indice}].data`}>
                            {(campo) => <CampoTexto campo={campo} rotulo="Data" type="date" />}
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
                            {(campo) => (
                              <CampoTexto
                                campo={campo}
                                rotulo="Observação"
                                className="md:col-span-5"
                              />
                            )}
                          </form.Field>
                        </div>
                      ))
                    )
                  }
                </form.Field>
                <p className="text-muted-foreground text-xs">
                  Parcelado: a primeira parcela cai um mês depois da data informada.
                </p>
              </CardContent>
            </Card>
          )
        }
      </form.Subscribe>

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
