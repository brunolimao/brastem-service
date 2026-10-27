// Testes de mutação (R-TST-02 automatizado): o Stryker altera o código de propósito (troca `>` por `>=`,
// apaga uma linha, inverte um `if`...) e roda os testes. Mutante que sobrevive = mudança que nenhum teste
// percebe. Roda toda semana no CI (`mutacao.yml`) e à mão com `pnpm --filter @brastem/server mutacao`.
// Limitado às regras de negócio: o resto (módulos do Nest, config) só daria ruído.
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts' },
  mutate: [
    'src/modules/**/*.service.ts',
    'src/modules/ordens-servico/garantia.ts',
    'src/common/utils/*.ts',
    'src/legacy/*.ts',
    '!src/**/*.spec.ts',
    '!src/legacy/dump-exemplo.ts',
  ],
  coverageAnalysis: 'perTest',
  // O TypeScript do projeto (7, nativo) não tem a API de compilador que o Stryker usa para reescrever o
  // tsconfig; o vitest não precisa disso (compila com SWC). Um nome que não existe desliga essa etapa.
  tsconfigFile: 'sem-tsconfig-para-o-stryker.json',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutacao/index.html' },
  // O banco em memória e o argon2 deixam os testes pesados: menos processos ao mesmo tempo.
  concurrency: 4,
  timeoutMS: 60_000,
  thresholds: { high: 80, low: 60, break: null },
}
