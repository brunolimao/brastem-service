import { expect, type Page, test } from '@playwright/test'

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
      await expect(page).toHaveScreenshot(`clientes-${tema}.png`, { fullPage: true })
    })

    test('ficha do cliente', async ({ page }) => {
      await page.goto('/clientes/31')
      await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(
        'Cliente Impressão Exemplo',
      )
      await expect(page).toHaveScreenshot(`cliente-${tema}.png`, { fullPage: true })
    })
  })
}
