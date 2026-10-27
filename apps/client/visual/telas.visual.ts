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

const prepararModelo = async (page: Page, modelo: 'novo' | 'antigo') => {
  await page.addInitScript((escolhido) => {
    localStorage.setItem(
      'brastem-preferencias',
      JSON.stringify({ state: { modeloDeImpressao: escolhido }, version: 0 }),
    )
  }, modelo)
}

test.describe('OS impressa', () => {
  // Janela mais alta que a folha A4, para a foto pegar a folha inteira.
  test.use({ viewport: { width: 1280, height: 1400 } })

  for (const modelo of ['novo', 'antigo'] as const) {
    test(`modelo ${modelo} (R-IMP-03)`, async ({ page }) => {
      await prepararModelo(page, modelo)
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
      await page.goto('/clientes')
      await expect(
        page.getByRole('cell', { name: 'Cliente Impressão Exemplo', exact: true }),
      ).toBeVisible()
      await fotoDaTela(page, `clientes-${tema}.png`)
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
