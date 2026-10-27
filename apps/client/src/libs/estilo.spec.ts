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

describe('largura da tela (R-UX-13)', () => {
  it('tela grande aproveita a largura: o conteúdo vai até 1536 px (antes parava em 1152 px)', () => {
    const layout = ler('../routes/_app.tsx')
    expect(layout).toContain('max-w-screen-2xl')
    expect(layout).not.toContain('max-w-6xl')
  })

  it('conteúdo encolhe até a largura da janela; tabela larga rola dentro dela', () => {
    expect(ler('../routes/_app.tsx')).toContain('grid max-w-screen-2xl grid-cols-1')
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

  it('no cartão estreito, título, descrição e botão do cabeçalho ficam um embaixo do outro', () => {
    const cartao = ler('../components/ui/card.tsx')
    expect(cartao).toContain('grid-cols-[minmax(0,1fr)_auto]')
    // Título, descrição e botão: cada um ocupa a linha inteira (antes título e descrição se sobrepunham).
    expect(cartao.match(/@max-md\/card-header:col-span-full/g)).toHaveLength(3)
  })
})

describe('barra de salvar e tabelas (R-UX-16, R-UX-17)', () => {
  it('a barra Voltar/Salvar flutua no canto, compacta, em vez de uma faixa de ponta a ponta', () => {
    const barra = ler('../components/layout/barra-acoes.tsx')
    expect(barra).toContain('sticky bottom-4')
    expect(barra).toContain('rounded-xl border bg-card/95 p-2 shadow-lg')
    // A faixa antiga ocupava a largura toda (-mx) e cortava os campos de baixo.
    expect(barra).not.toMatch(/-mx-/)
  })

  it('tabela compacta: cabeçalho cinza, linhas baixas, ações pequenas e paginação dentro do cartão', () => {
    const tabela = ler('../components/ui/table.tsx')
    expect(tabela).toContain('bg-muted/50')
    expect(tabela).toContain('px-3 py-1.5')
    // Cantos menos arredondados que os cartões (6 px em vez de 10 px).
    expect(ler('../components/data-table/data-table.tsx')).toContain(
      'overflow-hidden rounded-sm border',
    )
    // Rodapé (paginação) com o mesmo cinza do cabeçalho: a tabela fica emoldurada em cima e embaixo.
    expect(ler('../components/data-table/data-table.tsx')).toContain(
      'border-t bg-muted/50 px-4 py-2',
    )
    for (const tela of [
      '../routes/_app/clientes/index.tsx',
      '../routes/_app/ordens-servico/index.tsx',
    ]) {
      expect(ler(tela), tela).not.toContain('size="icon"')
    }
  })
})

describe('seções de Configurações (R-CFG-11)', () => {
  it('dois cartões por linha só em janela grande, com a mesma altura', () => {
    const secao = ler('../components/layout/secao.tsx')
    expect(secao).toContain("'lg:grid-cols-2'")
    // `items-start` deixava cartões vizinhos com alturas diferentes.
    expect(secao).not.toContain('items-start')
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

describe('cores de hover e destaque (R-UX-15)', () => {
  const css = ler('../index.css')
  const tema = (nome: ':root' | '.dark') => css.split(`${nome} {`)[1]?.split('}')[0] ?? ''

  it('o hover (accent) é um tom discreto, não o laranja da marca, nos dois temas', () => {
    // Laranja tem matiz perto de 35; o hover fica no azul-acinzentado da paleta.
    expect(tema(':root')).toMatch(/--accent: oklch\(0\.93 0\.025 255\)/)
    expect(tema(':root')).toMatch(/--accent-foreground: oklch\(0\.2 /)
    expect(tema('.dark')).toMatch(/--accent: oklch\(0\.3 0\.035 260\)/)
  })

  it('o laranja do item ativo do menu é escuro o bastante para o texto branco (4,6:1)', () => {
    expect(tema(':root')).toMatch(/--sidebar-primary: oklch\(0\.58 0\.19 35\)/)
    expect(tema(':root')).toMatch(/--sidebar-primary-foreground: oklch\(0\.99 0 0\)/)
  })
})

describe('papel da impressão (R-IMP-04)', () => {
  it('na impressão o fundo da página é branco, mesmo no tema escuro (sem faixa preta na margem)', () => {
    expect(ler('../index.css')).toMatch(/@media print \{\s*html,\s*body \{\s*background: white;/)
  })
})
