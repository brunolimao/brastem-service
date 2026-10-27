import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/** Algo aberto por cima da tela (diálogo, lista de opções, menu): o Esc é dele, não do formulário. */
const temAlgoAberto = () =>
  document.querySelector(
    '[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]',
  ) !== null

/**
 * "Voltar" dos formulários. **Esc** faz o mesmo, a não ser que um diálogo ou lista esteja aberto (aí o
 * Esc só fecha esse diálogo). Com alterações não salvas, o aviso de sair sem salvar pergunta antes.
 */
export function BotaoVoltar({ aoVoltar }: { aoVoltar: () => void }) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      // O Radix marca o Esc que já usou para fechar um diálogo (defaultPrevented).
      if (evento.key !== 'Escape' || evento.defaultPrevented || temAlgoAberto()) return
      aoVoltar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoVoltar])

  return (
    <Button type="button" variant="outline" onClick={aoVoltar} title="Voltar (Esc)">
      Voltar
    </Button>
  )
}
