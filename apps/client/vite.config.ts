import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const apiTarget = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:3333'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    // Mesma origem do back em produção: o cookie httpOnly funciona sem CORS.
    proxy: { '/api': apiTarget, '/docs': apiTarget },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // components/ui é o shadcn gerado; routeTree.gen.ts é gerado pelo roteador.
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/components/ui/**',
        'src/routeTree.gen.ts',
        'src/main.tsx',
      ],
      reporter: ['text-summary', 'json-summary', 'html'],
      // Mínimo conferido no CI: só sobe (R-TST-04).
      thresholds: { lines: 93, branches: 85 },
    },
  },
})
