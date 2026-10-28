import { expect, type Page, test } from '@playwright/test'

/**
 * O que muda de um Windows para outro sem ser defeito: o traço dos ícones (SVG) e o campo de data, que o
 * navegador escreve no formato do sistema (27/10/2026 aqui, 10/27/2026 no CI). Ficam cobertos na foto.
 */
const fotoDaTela = async (page: Page, nome: string) => {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await expect(page).toHaveScreenshot(nome, {
    fullPage: true,
    mask: [page.locator('svg[class*="lucide"]'), page.locator('input[type=date]')],
  })
}

/** Fotos das telas e da OS impressa (R-TST-08). Dados de `scripts/semear.mjs`, todos inventados. */
const ordem = () => process.env.ORDEM_PARA_IMPRIMIR

/** Preferências deste computador (as mesmas do `usePreferenciasStore`) antes de a página abrir. */
const preferir = async (
  page: Page,
  preferencias: { modeloDeImpressao?: 'novo' | 'antigo'; linhasPorPagina?: number },
) => {
  await page.addInitScript((estado) => {
    localStorage.setItem('brastem-preferencias', JSON.stringify({ state: estado, version: 0 }))
  }, preferencias)
}

test.describe('OS impressa', () => {
  // Janela mais alta que a folha A4, para a foto pegar a folha inteira.
  test.use({ viewport: { width: 1280, height: 1400 } })

  for (const modelo of ['novo', 'antigo'] as const) {
    test(`modelo ${modelo} (R-IMP-03)`, async ({ page }) => {
      await preferir(page, { modeloDeImpressao: modelo })
      await page.goto(`/ordens-servico/${ordem()}/imprimir`)
      const folha = page.getByRole('article')
      await expect(folha).toBeVisible()
      await expect(folha).toHaveScreenshot(`impressao-${modelo}.png`)
    })
  }
})

for (const tema of ['light', 'dark'] as const) {
  test.describe(`tema ${tema === 'light' ? 'claro' : 'escuro'}`, () => {
    test.use({ colorScheme: tema })

    test('lista de clientes', async ({ page }) => {
      // 10 linhas: a tabela inteira, com o rodapé da paginação, cabe na foto.
      await preferir(page, { linhasPorPagina: 10 })
      await page.goto('/clientes')
      await expect(
        page.getByRole('cell', { name: 'Cliente Impressão Exemplo', exact: true }),
      ).toBeVisible()
      await fotoDaTela(page, `clientes-${tema}.png`)
    })

    test('cores exatas: rodapé da tabela igual ao cabeçalho, menu ativo laranja (R-UX-15, R-UX-17)', async ({
      page,
    }) => {
      await page.goto('/clientes')
      await expect(
        page.getByRole('cell', { name: 'Cliente Impressão Exemplo', exact: true }),
      ).toBeVisible()
      const fundo = (seletor: string) =>
        page
          .locator(seletor)
          .first()
          .evaluate((elemento) => getComputedStyle(elemento).backgroundColor)
      const cabecalho = await fundo('thead')
      expect(cabecalho).not.toBe('rgba(0, 0, 0, 0)')
      expect(await fundo('[data-slot=table-container] + div')).toBe(cabecalho)
      expect(await fundo('a[aria-current=page]')).toBe('oklch(0.58 0.19 35)')
    })

    test('ficha do cliente', async ({ page }) => {
      await page.goto('/clientes/31')
      await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(
        'Cliente Impressão Exemplo',
      )
      await fotoDaTela(page, `cliente-${tema}.png`)
    })
  })
}
