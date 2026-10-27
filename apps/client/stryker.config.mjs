// Testes de mutação (R-TST-02 automatizado) nas funções puras do client: dinheiro, datas, máscaras,
// períodos, ordenação e as conversões dos models. Ver `apps/server/stryker.config.mjs`.
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vite.config.ts' },
  mutate: ['src/libs/*.ts', 'src/models/*.ts', '!src/**/*.spec.ts'],
  coverageAnalysis: 'perTest',
  // Ver o comentário igual em apps/server/stryker.config.mjs.
  tsconfigFile: 'sem-tsconfig-para-o-stryker.json',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutacao/index.html' },
  concurrency: 4,
  timeoutMS: 60_000,
  thresholds: { high: 80, low: 60, break: null },
}
