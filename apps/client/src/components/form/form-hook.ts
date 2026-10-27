import { createFormHook } from '@tanstack/react-form'
import { BotaoSalvar } from './botao-salvar'
import { CampoCheckbox } from './campo-checkbox'
import { CampoDinheiro } from './campo-dinheiro'
import { CampoOpcoes } from './campo-opcoes'
import { CampoSelect } from './campo-select'
import { CampoTextarea } from './campo-textarea'
import { CampoTexto } from './campo-texto'
import { fieldContext, formContext } from './contexto'
import { VigiarAlteracoes } from './vigiar-alteracoes'

/**
 * Hook de formulário do app. Os campos e o botão de salvar ficam registrados aqui, então cada
 * formulário só diz o nome e o rótulo, e tudo sai tipado pelos valores daquele formulário:
 *
 *   const form = useAppForm({ defaultValues, validators: { onChange: schema }, onSubmit })
 *   <form.AppField name="nome">{(campo) => <campo.CampoTexto rotulo="Nome" />}</form.AppField>
 *   <form.AppForm><form.BotaoSalvar /></form.AppForm>
 *   <form.AppForm><form.VigiarAlteracoes /></form.AppForm>   (avisa ao sair sem salvar)
 *
 * Grupos de campos usados em mais de um formulário (ex.: pagamentos) usam `withFieldGroup`.
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CampoCheckbox,
    CampoDinheiro,
    CampoOpcoes,
    CampoSelect,
    CampoTextarea,
    CampoTexto,
  },
  formComponents: { BotaoSalvar, VigiarAlteracoes },
})
