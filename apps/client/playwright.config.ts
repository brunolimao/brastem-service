import { defineConfig } from '@playwright/test'

/**
 * Comparação de imagens (R-TST-08): fotografa telas e a OS impressa com dados inventados e compara com as
 * fotos aprovadas em `visual/__fotos__`. Precisa do build (`pnpm build`). Rodar: `pnpm --filter
 * @brastem/client visual`; aprovar fotos novas depois de conferir: `... visual:aprovar`.
 * Usa o Edge instalado no Windows (não baixa navegador).
 */
export default defineConfig({
  testDir: 'visual',
  testMatch: '*.visual.ts',
  snapshotPathTemplate: '{testDir}/__fotos__/{arg}{ext}',
  globalSetup: './visual/preparar.mjs',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  expect: {
    // Até 100 pixels de serrilhado diferente passam; uma porcentagem da tela deixaria passar a cor de
    // um botão (o item ativo do menu é menos de 1% da foto). A tolerância de cor por pixel também é
    // baixa: a padrão (0,2) aceita trocar o laranja do menu por um laranja mais claro.
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.05,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    channel: 'msedge',
    // O serrilhado das letras depende do ClearType e da tela de cada Windows: a foto do CI saía diferente
    // da local em centenas de pixels. Letras em tons de cinza, sem subpixel, e cores em sRGB fixo deixam
    // a foto igual em qualquer computador.
    launchOptions: {
      args: [
        '--disable-lcd-text',
        '--disable-font-subpixel-positioning',
        '--font-render-hinting=none',
        '--force-color-profile=srgb',
        '--force-device-scale-factor=1',
      ],
    },
    baseURL: 'http://127.0.0.1:3410',
    storageState: 'visual/.sessao.json',
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
})
