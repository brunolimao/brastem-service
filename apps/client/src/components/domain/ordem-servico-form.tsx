import { Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { PagamentosCampos } from '@/components/domain/pagamentos-campos'
import { BotaoVoltar } from '@/components/form/botao-voltar'
import { useAppForm } from '@/components/form/form-hook'
import { salvarSeAlterou } from '@/components/form/salvar-se-alterou'
import { BarraAcoes } from '@/components/layout/barra-acoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  mostrarPagamentos,
  OPCOES_STATUS,
  type OrdemServicoForm,
  ordemServicoFormSchema,
} from '@/models/ordem-servico.model'

interface OrdemServicoFormProps {
  valoresIniciais: OrdemServicoForm
  aoSalvar: (valores: OrdemServicoForm) => Promise<unknown>
  aoCancelar: () => void
  /** Depois de salvar pelo botão Salvar (ex.: voltar para a lista). */
  aoConcluir?: () => void
  /** Só na edição: mostra o botão Imprimir, que salva antes o que foi alterado. */
  aoImprimir?: () => void
  /** Cartões depois dos campos e antes da barra de Voltar/Salvar (ex.: últimos serviços do aparelho). */
  depoisDosCampos?: ReactNode
}

export function OrdemServicoFormulario({
  valoresIniciais,
  aoSalvar,
  aoCancelar,
  aoConcluir,
  aoImprimir,
  depoisDosCampos,
}: OrdemServicoFormProps) {
  const form = useAppForm({
    defaultValues: valoresIniciais,
    validators: { onChange: ordemServicoFormSchema },
    onSubmitMeta: {} as { depois?: () => void },
    onSubmit: async ({ value, meta }) => {
      await aoSalvar(value)
      ;(meta.depois ?? aoConcluir)?.()
    },
  })

  return (
    <form
      className="grid grid-cols-1 gap-6"
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
          <form.AppField name="abertura">
            {(campo) => <campo.CampoTexto rotulo="Data de abertura" type="date" />}
          </form.AppField>
          <form.AppField name="status">
            {(campo) => <campo.CampoSelect rotulo="Status" opcoes={OPCOES_STATUS} />}
          </form.AppField>
          <form.AppField name="valor">
            {(campo) => <campo.CampoDinheiro rotulo="Valor" />}
          </form.AppField>
          <form.AppField name="taxaDeslocamento">
            {(campo) => <campo.CampoDinheiro rotulo="Taxa de deslocamento" />}
          </form.AppField>
          <form.AppField name="isGarantia">
            {(campo) => (
              <campo.CampoCheckbox rotulo="Atendimento em garantia" className="md:col-span-4" />
            )}
          </form.AppField>
          <form.AppField name="relatado">
            {(campo) => (
              <campo.CampoTextarea rotulo="Problema relatado" className="md:col-span-2" rows={3} />
            )}
          </form.AppField>
          <form.AppField name="identificado">
            {(campo) => (
              <campo.CampoTextarea
                rotulo="Problema identificado"
                className="md:col-span-2"
                rows={3}
              />
            )}
          </form.AppField>

          <form.Subscribe selector={(estado) => estado.values.status === 'FECHADO'}>
            {(fechada) =>
              fechada && (
                <>
                  <form.AppField name="solucionado">
                    {(campo) => (
                      <campo.CampoTextarea
                        rotulo="Problema solucionado"
                        className="md:col-span-2"
                        rows={3}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="fechamento">
                    {(campo) => <campo.CampoTexto rotulo="Fechado em" type="date" />}
                  </form.AppField>
                  <form.AppField name="garantiaDias">
                    {(campo) => (
                      <campo.CampoTexto
                        rotulo="Garantia (dias)"
                        inputMode="numeric"
                        formatar={(valor) => valor.replace(/\D/g, '')}
                      />
                    )}
                  </form.AppField>
                </>
              )
            }
          </form.Subscribe>

          <form.AppField name="observacao">
            {(campo) => (
              <campo.CampoTextarea rotulo="Observação" className="md:col-span-4" rows={2} />
            )}
          </form.AppField>
        </CardContent>
      </Card>

      <form.Subscribe selector={(estado) => mostrarPagamentos(estado.values)}>
        {(visivel) =>
          visivel && <PagamentosCampos form={form} fields={{ pagamentos: 'pagamentos' }} />
        }
      </form.Subscribe>

      {/* Antes da barra: os botões ficam sempre por último na página, mesmo quando ela não rola. */}
      {depoisDosCampos}

      <BarraAcoes>
        <BotaoVoltar aoVoltar={aoCancelar} />
        {aoImprimir && (
          <Button
            type="button"
            variant="outline"
            // Como no sistema antigo: imprime o que está na tela, então salva antes se algo mudou.
            onClick={() => salvarSeAlterou(form, aoImprimir)}
          >
            <Printer /> Imprimir
          </Button>
        )}
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
