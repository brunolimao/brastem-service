import { describe, expect, it } from 'vitest'
import {
  aplicarPaleta,
  CARTAO_ESCURO,
  contraste,
  LETRA_DO_MENU,
  misturar,
  PALETAS,
  paletaPorId,
  variaveisDaPaleta,
} from './paletas'

describe('paletas (R-UX-19)', () => {
  it('são 8, com nomes e ids sem repetir; a primeira é a azul e tomate de sempre', () => {
    expect(PALETAS).toHaveLength(8)
    expect(new Set(PALETAS.map((paleta) => paleta.id)).size).toBe(8)
    expect(new Set(PALETAS.map((paleta) => paleta.nome)).size).toBe(8)
    expect(PALETAS[0]).toMatchObject({ id: 'azul-tomate', destaque: '#ff6347' })
  })

  it('preferência desconhecida volta para a padrão', () => {
    expect(paletaPorId('nao-existe').id).toBe('azul-tomate')
    expect(paletaPorId('violeta-pessego').nome).toBe('Violeta e pêssego')
  })

  it('contraste calculado como no WCAG', () => {
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21)
    expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
    expect(misturar('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  for (const paleta of PALETAS) {
    describe(paleta.nome, () => {
      const claro = variaveisDaPaleta(paleta, false)
      const escuro = variaveisDaPaleta(paleta, true)

      it('texto dos botões legível nos dois temas (4,5:1)', () => {
        expect(
          contraste(claro['--primary'] ?? '', claro['--primary-foreground'] ?? ''),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contraste(escuro['--primary'] ?? '', escuro['--primary-foreground'] ?? ''),
        ).toBeGreaterThanOrEqual(4.5)
      })

      it('link na cor principal legível sobre o cartão (branco no claro, escuro no escuro)', () => {
        expect(contraste(paleta.primaria, '#ffffff')).toBeGreaterThanOrEqual(4.5)
        expect(contraste(paleta.primariaEscura, CARTAO_ESCURO)).toBeGreaterThanOrEqual(4.5)
      })

      it('letra do menu legível no fundo do menu, no hover e no item ativo', () => {
        expect(contraste(LETRA_DO_MENU, paleta.menu)).toBeGreaterThanOrEqual(4.5)
        expect(contraste('#ffffff', claro['--sidebar-accent'] ?? '')).toBeGreaterThanOrEqual(4.5)
      })

      it('a marca do item ativo aparece no menu (3:1, como ícones e bordas)', () => {
        expect(contraste(paleta.destaque, claro['--sidebar-accent'] ?? '')).toBeGreaterThanOrEqual(
          3,
        )
      })
    })
  }

  it('aplicar troca as variáveis do tema e marca a paleta na página', () => {
    aplicarPaleta('indigo-coral', false)
    const estilo = document.documentElement.style
    expect(estilo.getPropertyValue('--primary')).toBe('#3b40c4')
    expect(estilo.getPropertyValue('--sidebar-primary')).toBe('#ff6f59')
    expect(document.documentElement.dataset.paleta).toBe('indigo-coral')

    aplicarPaleta('indigo-coral', true)
    expect(estilo.getPropertyValue('--primary')).toBe('#9a9ef0')

    aplicarPaleta('invalida', false)
    expect(document.documentElement.dataset.paleta).toBe('azul-tomate')
  })
})
