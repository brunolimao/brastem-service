import { describe, expect, it, vi } from 'vitest'
import {
  type JanelaDeEspera,
  mostrarTelaDeEspera,
  paginaSimples,
  TELA_DE_ESPERA,
} from './tela-de-espera'

const conteudo = (pagina: string) => decodeURIComponent(pagina.split(',')[1] ?? '')

/** Janela falsa que registra a ordem das chamadas; com `desenha`, carregar dispara o "ready-to-show". */
function janelaFalsa({ desenha = true } = {}) {
  const passos: string[] = []
  let aoDesenhar: () => void = () => undefined
  const janela: JanelaDeEspera = {
    loadURL: vi.fn(async () => {
      passos.push('carregar')
      if (desenha) queueMicrotask(() => aoDesenhar())
    }),
    once: vi.fn((_evento, ouvinte) => {
      aoDesenhar = ouvinte
    }),
    show: vi.fn(() => {
      passos.push('mostrar')
    }),
    webContents: {
      executeJavaScript: vi.fn(async () => {
        passos.push('quadros')
      }),
    },
  }
  return { janela, passos }
}

describe('tela de espera ao abrir (R-ATU-01)', () => {
  it('diz que está iniciando, com o aviso de que pode demorar depois de atualizar', () => {
    const texto = conteudo(TELA_DE_ESPERA)
    expect(texto).toContain('Iniciando o Brastem-Service…')
    expect(texto).toContain('principalmente logo depois de uma atualização')
    expect(texto).toContain('class="anel"')
  })

  it('só mostra a janela depois que a página desenhou, e só resolve depois de ela aparecer', async () => {
    const { janela, passos } = janelaFalsa({ desenha: false })
    // Limite que nunca chega: quem libera é o "ready-to-show".
    const pronto = mostrarTelaDeEspera(janela, { dormir: () => new Promise(() => undefined) })
    await new Promise((resolver) => setTimeout(resolver, 10))
    expect(passos).toEqual(['carregar'])

    const desenhou = vi.mocked(janela.once).mock.calls[0]?.[1]
    desenhou?.()
    await pronto
    expect(passos).toEqual(['carregar', 'mostrar', 'quadros'])
    expect(janela.loadURL).toHaveBeenCalledWith(TELA_DE_ESPERA)
  })

  it('não fica preso se a página nunca desenhar: mostra a janela no limite e segue', async () => {
    const { janela, passos } = janelaFalsa({ desenha: false })
    const dormir = vi.fn(async () => undefined)
    await mostrarTelaDeEspera(janela, { dormir, limite: 3000 })
    expect(dormir).toHaveBeenCalledWith(3000)
    expect(passos).toContain('mostrar')
  })

  it('falha ao carregar a página não impede de abrir', async () => {
    const { janela } = janelaFalsa()
    vi.mocked(janela.loadURL).mockRejectedValueOnce(new Error('ERR_ABORTED'))
    vi.mocked(janela.webContents.executeJavaScript).mockRejectedValueOnce(new Error('destruída'))
    await expect(
      mostrarTelaDeEspera(janela, { dormir: async () => undefined }),
    ).resolves.toBeUndefined()
    expect(janela.show).toHaveBeenCalledOnce()
  })
})

describe('paginaSimples', () => {
  it('sem anel nem detalhe quando é só um aviso; com o botão quando há link', () => {
    const texto = conteudo(
      paginaSimples('Não foi possível abrir.', false, {
        link: { rotulo: 'Tentar de novo', endereco: 'http://127.0.0.1:47831' },
      }),
    )
    expect(texto).not.toContain('class="anel"')
    expect(texto).not.toContain('<small>')
    expect(texto).toContain('<a href="http://127.0.0.1:47831">Tentar de novo</a>')
  })
})
