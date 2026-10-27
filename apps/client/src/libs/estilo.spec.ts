import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// O jsdom não aplica CSS: aqui só garantimos que as regras continuam lá (o efeito foi conferido no app).
const ler = (caminho: string) => readFileSync(new URL(caminho, import.meta.url), 'utf8')

describe('cursor de clique', () => {
  it('botões habilitados mostram a "mãozinha" (o Tailwind 4 não põe mais)', () => {
    const css = ler('../index.css')
    expect(css).toMatch(/button:not\(:disabled\)[\s\S]*?\{\s*cursor: pointer;/)
  })

  it('itens das listas de seleção e dos menus também', () => {
    for (const componente of ['select.tsx', 'dropdown-menu.tsx']) {
      const codigo = ler(`../components/ui/${componente}`)
      expect(codigo, componente).not.toContain('cursor-default')
    }
  })
})

describe('cores dos componentes', () => {
  it('campos têm fundo próprio (--campo), diferente da página no modo claro', () => {
    expect(ler('../index.css')).toMatch(/--campo: oklch\(0\.965/)
    for (const componente of ['input.tsx', 'textarea.tsx', 'select.tsx', 'checkbox.tsx']) {
      const codigo = ler(`../components/ui/${componente}`)
      expect(codigo, componente).toContain('bg-campo')
    }
  })

  it('no modo escuro, o texto do botão continua claro ao passar o mouse', () => {
    const botao = ler('../components/ui/button.tsx')
    for (const variante of ['outline', 'ghost']) {
      // As classes da variante vão de "variante:" até o fim da string dela.
      const classes = botao.split(`${variante}:`)[1]?.split("',")[0] ?? ''
      expect(classes, variante).toContain('dark:hover:text-foreground')
    }
  })
})
