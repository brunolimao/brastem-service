import { useForm } from '@tanstack/react-form'
import { PagamentosCampos } from '@/components/domain/pagamentos-campos'
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
        {(visivel) => visivel && <PagamentosCampos form={form} />}
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
