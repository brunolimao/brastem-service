import { useNavigate } from '@tanstack/react-router'
import { FilePlus2, ListChecks, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BotaoExcluir } from '@/components/domain/botao-excluir'
import { useAppForm } from '@/components/form/form-hook'
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
  const form = useAppForm({
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
          <form.AppField name="nome">
            {(campo) => <campo.CampoTexto rotulo="Nome" className="md:col-span-2" autoFocus />}
          </form.AppField>
          <form.AppField name="cpf">
            {(campo) => <campo.CampoTexto rotulo="CPF/CNPJ" formatar={mascararCpfCnpj} />}
          </form.AppField>
          <form.AppField name="email">
            {(campo) => <campo.CampoTexto rotulo="E-mail" type="email" />}
          </form.AppField>
          <form.AppField name="recomendacao">
            {(campo) => (
              <campo.CampoOpcoes
                rotulo="Como conheceu"
                opcoes={OPCOES_RECOMENDACAO}
                className="md:col-span-2"
              />
            )}
          </form.AppField>
          <form.AppField name="negativado">
            {(campo) => <campo.CampoCheckbox rotulo="Cliente negativado" />}
          </form.AppField>
          <form.Subscribe selector={(estado) => estado.values.negativado}>
            {(negativado) =>
              negativado && (
                <form.AppField name="motivo">
                  {(campo) => <campo.CampoTexto rotulo="Motivo" />}
                </form.AppField>
              )
            }
          </form.Subscribe>
          {clienteId !== undefined && (
            <form.AppField name="dataCadastro">
              {(campo) => <campo.CampoTexto rotulo="Data de cadastro" type="date" />}
            </form.AppField>
          )}
          <form.AppField name="referencia">
            {(campo) => (
              <campo.CampoTextarea rotulo="Referência / observação" className="md:col-span-2" />
            )}
          </form.AppField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <form.AppField name="cep">
            {(campo) => (
              <campo.CampoTexto
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
          </form.AppField>
          <form.AppField name="endereco">
            {(campo) => <campo.CampoTexto rotulo="Endereço" className="md:col-span-3" />}
          </form.AppField>
          <form.AppField name="numero">
            {(campo) => <campo.CampoTexto rotulo="Número" />}
          </form.AppField>
          <form.AppField name="complemento">
            {(campo) => <campo.CampoTexto rotulo="Complemento" className="md:col-span-2" />}
          </form.AppField>
          <form.AppField name="bairro">
            {(campo) => <campo.CampoTexto rotulo="Bairro" className="md:col-span-2" />}
          </form.AppField>
          <form.AppField name="cidade">
            {(campo) => <campo.CampoTexto rotulo="Cidade" className="md:col-span-1" />}
          </form.AppField>
          <form.AppField name="uf">
            {(campo) => (
              <campo.CampoTexto
                rotulo="UF"
                maxLength={2}
                formatar={(valor) => valor.toUpperCase()}
              />
            )}
          </form.AppField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telefones</CardTitle>
          <CardAction>
            <form.AppField name="telefones" mode="array">
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
            </form.AppField>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form.AppField name="telefones" mode="array">
            {(lista) =>
              lista.state.value.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum telefone cadastrado.</p>
              ) : (
                lista.state.value.map((telefone, indice) => (
                  <div
                    key={telefone.chave}
                    className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-3"
                  >
                    <form.AppField name={`telefones[${indice}].nome`}>
                      {(campo) => <campo.CampoTexto rotulo="Nome do contato" />}
                    </form.AppField>
                    <form.AppField name={`telefones[${indice}].telefone`}>
                      {(campo) => (
                        <campo.CampoTexto
                          rotulo="Telefone"
                          inputMode="tel"
                          formatar={mascararTelefone}
                        />
                      )}
                    </form.AppField>
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
          </form.AppField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparelhos</CardTitle>
          <CardAction>
            <form.AppField name="aparelhos" mode="array">
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
            </form.AppField>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form.AppField name="aparelhos" mode="array">
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
                      <form.AppField name={`aparelhos[${indice}].nome`}>
                        {(campo) => <campo.CampoTexto rotulo="Aparelho" />}
                      </form.AppField>
                      <form.AppField name={`aparelhos[${indice}].marca`}>
                        {(campo) => <campo.CampoTexto rotulo="Marca" />}
                      </form.AppField>
                      <form.AppField name={`aparelhos[${indice}].modelo`}>
                        {(campo) => <campo.CampoTexto rotulo="Modelo" />}
                      </form.AppField>
                      <form.AppField name={`aparelhos[${indice}].pnc`}>
                        {(campo) => <campo.CampoTexto rotulo="PNC" />}
                      </form.AppField>
                    </div>
                    <form.AppField name={`aparelhos[${indice}].observacao`}>
                      {(campo) => <campo.CampoTextarea rotulo="Observação" rows={2} />}
                    </form.AppField>
                    {aparelho.garantiaAte && (
                      <p className="text-muted-foreground text-sm">
                        Garantia do serviço até {formatarData(aparelho.garantiaAte)}
                      </p>
                    )}
                  </div>
                ))
              )
            }
          </form.AppField>
        </CardContent>
      </Card>

      <BarraAcoes>
        <Button type="button" variant="outline" onClick={aoCancelar}>
          Voltar
        </Button>
        <form.AppForm>
          <form.BotaoSalvar />
        </form.AppForm>
      </BarraAcoes>
    </form>
  )
}
