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

describe('janela estreita (R-UX-13)', () => {
  it('conteúdo encolhe até a largura da janela; tabela larga rola dentro dela', () => {
    expect(ler('../routes/_app.tsx')).toContain('grid max-w-6xl grid-cols-1')
    expect(ler('../components/data-table/data-table.tsx')).toContain('grid min-w-0 grid-cols-1')
    for (const formulario of ['cliente-form.tsx', 'ordem-servico-form.tsx', 'transacao-form.tsx']) {
      expect(ler(`../components/domain/${formulario}`), formulario).toContain(
        'grid grid-cols-1 gap-6',
      )
    }
  })

  it('título, ações e barra de salvar quebram linha em vez de passar da borda', () => {
    const cabecalho = ler('../components/layout/page-header.tsx')
    expect(cabecalho).toContain('flex flex-wrap items-start justify-between')
    expect(cabecalho).toContain('flex flex-wrap items-center gap-2')
    expect(ler('../components/layout/barra-acoes.tsx')).toContain('flex flex-wrap')
  })

  it('no cartão estreito, o botão do cabeçalho desce para baixo do título', () => {
    const cartao = ler('../components/ui/card.tsx')
    expect(cartao).toContain('grid-cols-[minmax(0,1fr)_auto]')
    expect(cartao).toContain('@max-md/card-header:col-start-1')
  })
})

describe('botão contornado no modo claro (R-UX-14)', () => {
  it('se destaca do fundo da página: fundo do cartão, borda mais forte e sombra', () => {
    const botao = ler('../components/ui/button.tsx')
    const classes = botao.split('outline:')[1]?.split("',")[0] ?? ''
    expect(classes).toContain('border-input bg-card shadow-sm')
    expect(classes).not.toContain(' bg-background')
    // A borda dos campos e do botão é mais escura que a das linhas e cartões.
    expect(ler('../index.css')).toMatch(/--input: oklch\(0\.87 /)
  })
})
