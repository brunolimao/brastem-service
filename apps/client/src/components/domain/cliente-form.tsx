import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { FilePlus2, ListChecks, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { CampoCheckbox } from '@/components/form/campo-checkbox'
import { CampoOpcoes } from '@/components/form/campo-opcoes'
import { CampoTextarea } from '@/components/form/campo-textarea'
import { CampoTexto } from '@/components/form/campo-texto'
import { salvarSeAlterou } from '@/components/form/salvar-se-alterou'
import { BarraAcoes } from '@/components/layout/barra-acoes'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatarData } from '@/libs/formatters'
import { apenasDigitos, mascararCep, mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import {
  aparelhoVazio,
  type ClienteForm,
  clienteFormSchema,
  OPCOES_RECOMENDACAO,
  telefoneVazio,
} from '@/models/cliente.model'
import { buscarCep } from '@/services/viacep.service'

interface ClienteFormProps {
  valoresIniciais: ClienteForm
  aoSalvar: (valores: ClienteForm) => Promise<unknown>
  /** Só na edição: habilita os atalhos de OS de cada aparelho já salvo. */
  clienteId?: number
  aoCancelar: () => void
}

export function ClienteFormulario({
  valoresIniciais,
  aoSalvar,
  clienteId,
  aoCancelar,
}: ClienteFormProps) {
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: valoresIniciais,
    validators: { onChange: clienteFormSchema },
    onSubmitMeta: {} as { depois?: () => void },
    onSubmit: async ({ value, meta }) => {
      await aoSalvar(value)
      meta.depois?.()
    },
  })

  /** Ao completar 8 dígitos, preenche o endereço pelo ViaCEP (sem sobrescrever se o CEP não existir). */
  const preencherPeloCep = async (cep: string) => {
    if (apenasDigitos(cep).length !== 8) return
    try {
      const endereco = await buscarCep(apenasDigitos(cep))
      if (!endereco) {
        toast.error('CEP não encontrado')
        return
      }
      form.setFieldValue('endereco', endereco.endereco)
      form.setFieldValue('bairro', endereco.bairro)
      form.setFieldValue('cidade', endereco.cidade)
      form.setFieldValue('uf', endereco.uf)
    } catch {
      toast.error('Não foi possível consultar o CEP')
    }
  }

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
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <form.Field name="nome">
            {(campo) => (
              <CampoTexto campo={campo} rotulo="Nome" className="md:col-span-2" autoFocus />
            )}
          </form.Field>
          <form.Field name="cpf">
            {(campo) => <CampoTexto campo={campo} rotulo="CPF/CNPJ" formatar={mascararCpfCnpj} />}
          </form.Field>
          <form.Field name="email">
            {(campo) => <CampoTexto campo={campo} rotulo="E-mail" type="email" />}
          </form.Field>
          <form.Field name="recomendacao">
            {(campo) => (
              <CampoOpcoes
                campo={campo}
                rotulo="Como conheceu"
                opcoes={OPCOES_RECOMENDACAO}
                className="md:col-span-2"
              />
            )}
          </form.Field>
          <form.Field name="negativado">
            {(campo) => <CampoCheckbox campo={campo} rotulo="Cliente negativado" />}
          </form.Field>
          <form.Subscribe selector={(estado) => estado.values.negativado}>
            {(negativado) =>
              negativado && (
                <form.Field name="motivo">
                  {(campo) => <CampoTexto campo={campo} rotulo="Motivo" />}
                </form.Field>
              )
            }
          </form.Subscribe>
          {clienteId !== undefined && (
            <form.Field name="dataCadastro">
              {(campo) => <CampoTexto campo={campo} rotulo="Data de cadastro" type="date" />}
            </form.Field>
          )}
          <form.Field name="referencia">
            {(campo) => (
              <CampoTextarea
                campo={campo}
                rotulo="Referência / observação"
                className="md:col-span-2"
              />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <form.Field name="cep">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="CEP"
                className="md:col-span-2"
                inputMode="numeric"
                formatar={(valor) => {
                  const mascarado = mascararCep(valor)
                  void preencherPeloCep(mascarado)
                  return mascarado
                }}
              />
            )}
          </form.Field>
          <form.Field name="endereco">
            {(campo) => <CampoTexto campo={campo} rotulo="Endereço" className="md:col-span-3" />}
          </form.Field>
          <form.Field name="numero">
            {(campo) => <CampoTexto campo={campo} rotulo="Número" />}
          </form.Field>
          <form.Field name="complemento">
            {(campo) => <CampoTexto campo={campo} rotulo="Complemento" className="md:col-span-2" />}
          </form.Field>
          <form.Field name="bairro">
            {(campo) => <CampoTexto campo={campo} rotulo="Bairro" className="md:col-span-2" />}
          </form.Field>
          <form.Field name="cidade">
            {(campo) => <CampoTexto campo={campo} rotulo="Cidade" className="md:col-span-1" />}
          </form.Field>
          <form.Field name="uf">
            {(campo) => (
              <CampoTexto
                campo={campo}
                rotulo="UF"
                maxLength={2}
                formatar={(valor) => valor.toUpperCase()}
              />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telefones</CardTitle>
          <CardAction>
            <form.Field name="telefones" mode="array">
              {(campo) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => campo.pushValue(telefoneVazio())}
                >
                  <Plus /> Adicionar telefone
                </Button>
              )}
            </form.Field>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form.Field name="telefones" mode="array">
            {(lista) =>
              lista.state.value.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum telefone cadastrado.</p>
              ) : (
                lista.state.value.map((telefone, indice) => (
                  <div
                    key={telefone.chave}
                    className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-3"
                  >
                    <form.Field name={`telefones[${indice}].nome`}>
                      {(campo) => <CampoTexto campo={campo} rotulo="Nome do contato" />}
                    </form.Field>
                    <form.Field name={`telefones[${indice}].telefone`}>
                      {(campo) => (
                        <CampoTexto
                          campo={campo}
                          rotulo="Telefone"
                          inputMode="tel"
                          formatar={mascararTelefone}
                        />
                      )}
                    </form.Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      aria-label="Remover telefone"
                      onClick={() => lista.removeValue(indice)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                ))
              )
            }
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparelhos</CardTitle>
          <CardAction>
            <form.Field name="aparelhos" mode="array">
              {(campo) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => campo.pushValue(aparelhoVazio())}
                >
                  <Plus /> Adicionar aparelho
                </Button>
              )}
            </form.Field>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form.Field name="aparelhos" mode="array">
            {(lista) =>
              lista.state.value.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum aparelho cadastrado.</p>
              ) : (
                lista.state.value.map((aparelho, indice) => (
                  <div key={aparelho.chave} className="grid gap-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Aparelho {indice + 1}</h3>
                      <div className="flex items-center gap-2">
                        {clienteId !== undefined && aparelho.id !== undefined && (
                          // Como no sistema antigo: salvam antes o que foi alterado, senão se perderia.
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                salvarSeAlterou(form, () =>
                                  navigate({
                                    to: '/ordens-servico',
                                    search: { aparelhoId: aparelho.id },
                                  }),
                                )
                              }
                            >
                              <ListChecks /> Ver OS
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                salvarSeAlterou(form, () =>
                                  navigate({
                                    to: '/ordens-servico/nova',
                                    search: { clienteId, aparelhoId: aparelho.id },
                                  }),
                                )
                              }
                            >
                              <FilePlus2 /> Gerar OS
                            </Button>
                          </>
                        )}
                        {aparelho.id === undefined ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remover aparelho ${indice + 1}`}
                            onClick={() => lista.removeValue(indice)}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        ) : (
                          // Aparelho já salvo: ao salvar o cliente, as OS e os pagamentos dele vão junto.
                          <BotaoExcluir
                            titulo={`Remover aparelho ${indice + 1}`}
                            descricao="Ao salvar o cliente, este aparelho será excluído junto com todas as ordens de serviço e pagamentos dele. Isso não pode ser desfeito."
                            aoConfirmar={() => lista.removeValue(indice)}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <form.Field name={`aparelhos[${indice}].nome`}>
                        {(campo) => <CampoTexto campo={campo} rotulo="Aparelho" />}
                      </form.Field>
                      <form.Field name={`aparelhos[${indice}].marca`}>
                        {(campo) => <CampoTexto campo={campo} rotulo="Marca" />}
                      </form.Field>
                      <form.Field name={`aparelhos[${indice}].modelo`}>
                        {(campo) => <CampoTexto campo={campo} rotulo="Modelo" />}
                      </form.Field>
                      <form.Field name={`aparelhos[${indice}].pnc`}>
                        {(campo) => <CampoTexto campo={campo} rotulo="PNC" />}
                      </form.Field>
                    </div>
                    <form.Field name={`aparelhos[${indice}].observacao`}>
                      {(campo) => <CampoTextarea campo={campo} rotulo="Observação" rows={2} />}
                    </form.Field>
                    {aparelho.garantiaAte && (
                      <p className="text-muted-foreground text-sm">
                        Garantia do serviço até {formatarData(aparelho.garantiaAte)}
                      </p>
                    )}
                  </div>
                ))
              )
            }
          </form.Field>
        </CardContent>
      </Card>

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
