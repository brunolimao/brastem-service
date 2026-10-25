import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/common/database/schema/index.ts',
  out: './src/common/database/migrations',
})
