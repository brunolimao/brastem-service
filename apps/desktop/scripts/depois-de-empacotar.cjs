// Gancho do electron-builder (afterPack): leva as dependências do servidor para dentro do pacote.
// O electron-builder descarta qualquer pasta node_modules em extraResources, mesmo com filtro explícito,
// e sem elas o servidor embutido não encontra o NestJS.
const { cpSync, existsSync } = require('node:fs')
const { join } = require('node:path')

exports.default = async function depoisDeEmpacotar(contexto) {
  const origem = join(__dirname, '..', '.stage', 'server', 'node_modules')
  const destino = join(contexto.appOutDir, 'resources', 'server', 'node_modules')

  if (!existsSync(origem)) {
    throw new Error(`Faltou ${origem}. Rode "pnpm preparar" antes do electron-builder.`)
  }
  cpSync(origem, destino, { recursive: true })
}
