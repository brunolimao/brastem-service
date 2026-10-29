import { useStore } from '@tanstack/react-form'
import { Check, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { PagamentosCampos } from '@/components/domain/pagamentos-campos'
import { BotaoVoltar } from '@/components/form/botao-voltar'
import { useAppForm } from '@/components/form/form-hook'
import { salvarSeAlterou } from '@/components/form/salvar-se-alterou'
import { BarraAcoes } from '@/components/layout/barra-acoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/libs/utils'
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
  /**
   * Modelo de tela E · Cartões (em teste): os mesmos campos em etapas (problema, situação e valores,
   * pagamento). Todas ficam montadas; só a atual aparece, então nada se perde ao voltar.
   */
  passoAPasso?: boolean
}

/** Etapas do passo a passo e os campos de cada uma (para levar à etapa do primeiro erro). */
const ETAPAS = [
  { titulo: 'Problema', detalhe: 'O que o cliente contou', campos: ['relatado', 'identificado'] },
  {
    titulo: 'Situação e valores',
    detalhe: 'Status, datas e valor',
    campos: [
      'abertura',
      'status',
      'valor',
      'taxaDeslocamento',
      'solucionado',
      'fechamento',
      'garantiaDias',
    ],
  },
  { titulo: 'Pagamento', detalhe: 'Como foi pago', campos: ['pagamentos'] },
] as const

export function OrdemServicoFormulario({
  valoresIniciais,
  aoSalvar,
  aoCancelar,
  aoConcluir,
  aoImprimir,
  depoisDosCampos,
  passoAPasso = false,
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

  const [etapa, setEtapa] = useState(0)
  const formulario = useRef<HTMLFormElement>(null)
  const tentativas = useStore(form.store, (estado) => estado.submissionAttempts)
  const valido = useStore(form.store, (estado) => estado.isValid)

  // Passo a passo: salvar com erro leva à etapa do primeiro campo errado e põe o cursor nele.
  useEffect(() => {
    if (!passoAPasso || tentativas === 0 || valido) return
    const meta = form.state.fieldMeta as Record<string, { errors?: unknown[] } | undefined>
    const comErro = ETAPAS.findIndex((item) =>
      Object.keys(meta).some(
        (nome) =>
          (meta[nome]?.errors?.length ?? 0) > 0 &&
          item.campos.some((campo) => nome === campo || nome.startsWith(`${campo}[`)),
      ),
    )
    if (comErro >= 0) setEtapa(comErro)
    requestAnimationFrame(() =>
      formulario.current
        ?.querySelector<HTMLElement>('[data-etapa-atual] [aria-invalid="true"]')
        ?.focus(),
    )
  }, [passoAPasso, tentativas, valido, form])

  const garantia = (
    <form.AppField name="isGarantia">
      {(campo) => (
        <campo.CampoCheckbox rotulo="Atendimento em garantia" className="md:col-span-4" />
      )}
    </form.AppField>
  )
  const problema = (
    <>
      <form.AppField name="relatado">
        {(campo) => (
          <campo.CampoTextarea rotulo="Problema relatado" className="md:col-span-2" rows={3} />
        )}
      </form.AppField>
      <form.AppField name="identificado">
        {(campo) => (
          <campo.CampoTextarea rotulo="Problema identificado" className="md:col-span-2" rows={3} />
        )}
      </form.AppField>
    </>
  )
  const situacao = (
    <>
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
    </>
  )
  const fechamento = (
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
  )
  const observacao = (
    <form.AppField name="observacao">
      {(campo) => <campo.CampoTextarea rotulo="Observação" className="md:col-span-4" rows={2} />}
    </form.AppField>
  )
  const pagamentos = (
    <form.Subscribe selector={(estado) => mostrarPagamentos(estado.values)}>
      {(visivel) =>
        visivel ? (
          <PagamentosCampos form={form} fields={{ pagamentos: 'pagamentos' }} />
        ) : (
          passoAPasso && (
            <Card>
              <CardContent className="text-muted-foreground">
                Os pagamentos aparecem quando a OS é fechada ou tem taxa de deslocamento.
              </CardContent>
            </Card>
          )
        )
      }
    </form.Subscribe>
  )

  const ultima = etapa === ETAPAS.length - 1
  const conteudoDaEtapa = [
    <Card key="problema">
      <CardHeader>
        <CardTitle className="text-xl">O que está acontecendo com o aparelho?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        {problema}
        {garantia}
      </CardContent>
    </Card>,
    <Card key="situacao">
      <CardHeader>
        <CardTitle className="text-xl">Como fica a OS agora?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        {situacao}
        {fechamento}
        {observacao}
      </CardContent>
    </Card>,
    <div key="pagamento">{pagamentos}</div>,
  ]

  return (
    <form
      ref={formulario}
      className="grid grid-cols-1 gap-6"
      onSubmit={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        form.handleSubmit().catch(() => undefined)
      }}
    >
      {passoAPasso ? (
        <>
          <ol aria-label="Etapas" className="grid gap-2 sm:grid-cols-3">
            {ETAPAS.map((item, indice) => {
              const atual = indice === etapa
              const feita = indice < etapa
              return (
                <li key={item.titulo}>
                  <button
                    type="button"
                    aria-current={atual ? 'step' : undefined}
                    onClick={() => setEtapa(indice)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left',
                      atual && 'border-primary bg-accent',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-sm',
                        atual || feita
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {feita ? <Check className="size-4" /> : indice + 1}
                    </span>
                    <span>
                      <span className="block font-bold">{item.titulo}</span>
                      <span className="block text-muted-foreground text-sm">{item.detalhe}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          {conteudoDaEtapa.map((conteudo, indice) => (
            <div
              key={ETAPAS[indice]?.titulo}
              className={cn(indice !== etapa && 'hidden')}
              {...(indice === etapa ? { 'data-etapa-atual': '' } : {})}
            >
              {conteudo}
            </div>
          ))}
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              {situacao}
              {garantia}
              {problema}
              {fechamento}
              {observacao}
            </CardContent>
          </Card>
          {pagamentos}
        </>
      )}

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
        {passoAPasso && etapa > 0 && (
          <Button type="button" variant="outline" onClick={() => setEtapa(etapa - 1)}>
            <ChevronLeft /> {ETAPAS[etapa - 1]?.titulo}
          </Button>
        )}
        {passoAPasso && !ultima && (
          <Button type="button" variant="secondary" onClick={() => setEtapa(etapa + 1)}>
            {ETAPAS[etapa + 1]?.titulo} <ChevronRight />
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
