/** Entrega um arquivo gerado na tela para o usuário salvar (o app pergunta onde, como num download). */
export function baixarArquivo(arquivo: Blob, nome: string) {
  const endereco = URL.createObjectURL(arquivo)
  const link = Object.assign(document.createElement('a'), { href: endereco, download: nome })
  document.body.append(link)
  link.click()
  link.remove()
  // Revogar logo cancela o download em alguns navegadores: espera ele começar.
  setTimeout(() => URL.revokeObjectURL(endereco), 10_000)
}
