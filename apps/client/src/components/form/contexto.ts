import { createFormHookContexts } from '@tanstack/react-form'

/**
 * Contextos que ligam cada campo (`form.AppField`) e o formulário (`form.AppForm`) aos componentes
 * registrados em `form-hook.ts`. Ficam separados para os componentes de campo poderem usá-los sem
 * importar o hook (que importa os componentes).
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
