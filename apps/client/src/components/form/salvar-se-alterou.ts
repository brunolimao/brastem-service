/** O mínimo de um formulário do TanStack Form que aceita `{ depois }` no envio (`onSubmitMeta`). */
interface FormularioComDepois {
  state: { isDirty: boolean }
  handleSubmit: (meta: { depois?: () => void }) => Promise<void>
}

/**
 * Antes de sair da tela por um atalho (Imprimir, Gerar OS...), salva o que foi alterado e só então
 * segue. Se o formulário tiver erro, ele não salva e fica na tela mostrando o erro.
 */
export function salvarSeAlterou(form: FormularioComDepois, depois: () => void) {
  if (!form.state.isDirty) {
    depois()
    return
  }
  form.handleSubmit({ depois }).catch(() => undefined)
}
