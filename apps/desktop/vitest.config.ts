import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // O main.ts só liga as peças do Electron; quem o cobre é o teste de fumaça (scripts/fumaca.mjs).
      exclude: ['src/**/*.spec.ts', 'src/main.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      // Mínimo conferido no CI: só sobe (R-TST-04).
      thresholds: { lines: 92 },
    },
  },
})
