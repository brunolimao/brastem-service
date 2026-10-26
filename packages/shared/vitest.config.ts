import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts'],
      reporter: ['text-summary', 'json-summary', 'html'],
      // Mínimo conferido no CI: só sobe (R-TST-04).
      thresholds: { lines: 95 },
    },
  },
})
