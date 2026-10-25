import { tmpdir } from 'node:os'
import { join } from 'node:path'
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // Os testes e2e sobem o Nest inteiro; no CI (Windows, vários arquivos em paralelo) isso passa de 10 s.
    hookTimeout: 60_000,
    testTimeout: 30_000,
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    // Nada de escrever em ./data durante os testes; testes de backup definem a própria pasta.
    env: { NODE_ENV: 'test', DATA_DIR: join(tmpdir(), 'brastem-testes') },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
})
