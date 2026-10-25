// Monta apps/desktop/.stage: o servidor pronto para rodar (com node_modules reais) e o front compilado.
// O electron-builder leva essas duas pastas para dentro do instalador (ver electron-builder.yml).
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const raiz = resolve(desktop, '..', '..')
const stage = join(desktop, '.stage')
const servidor = join(stage, 'server')
const interfaceCompilada = join(raiz, 'apps', 'client', 'dist')

const exigir = (caminho, aviso) => {
  if (!existsSync(caminho))
    throw new Error(`${aviso} (faltou ${caminho}). Rode "pnpm build" na raiz.`)
}

exigir(join(raiz, 'apps', 'server', 'dist', 'bootstrap.js'), 'O servidor não foi compilado')
exigir(join(interfaceCompilada, 'index.html'), 'O front não foi compilado')

rmSync(stage, { recursive: true, force: true })

// `deploy` copia o servidor com só as dependências de produção; "hoisted" gera node_modules reais
// (sem os links simbólicos do pnpm), que é o que o instalador precisa.
execFileSync(
  'pnpm',
  // Caminho relativo: o shell quebraria um caminho absoluto com espaços (ex.: "Projetos VSCode").
  [
    '--filter=@brastem/server',
    'deploy',
    relative(raiz, servidor).split(sep).join('/'),
    '--prod',
    '--config.node-linker=hoisted',
  ],
  { cwd: raiz, stdio: 'inherit', shell: true },
)

cpSync(interfaceCompilada, join(stage, 'client'), { recursive: true })

// Fora do instalador: código-fonte, testes e configuração de desenvolvimento do servidor.
for (const sobra of [
  'src',
  'test',
  'scripts',
  'drizzle.config.ts',
  'nest-cli.json',
  'tsconfig.json',
  'tsconfig.test.json',
  'vitest.config.ts',
  '.env.example',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
]) {
  rmSync(join(servidor, sobra), { recursive: true, force: true })
}
rmSync(join(servidor, 'node_modules', '.pnpm'), { recursive: true, force: true })
rmSync(join(servidor, 'node_modules', '.modules.yaml'), { force: true })

// O better-sqlite3 traz um binário por plataforma; só o do Windows x64 interessa.
const prebuilds = join(servidor, 'node_modules', 'better-sqlite3', 'prebuilds')
if (existsSync(prebuilds)) {
  for (const arquivo of readdirSync(prebuilds)) {
    if (arquivo !== 'win32-x64.node') rmSync(join(prebuilds, arquivo), { force: true })
  }
}

exigir(join(servidor, 'dist', 'bootstrap.js'), 'O deploy não trouxe o servidor compilado')
exigir(
  join(servidor, 'dist', 'common', 'database', 'migrations'),
  'O deploy não trouxe as migrations',
)
exigir(join(prebuilds, 'win32-x64.node'), 'Faltou o binário do SQLite para Windows')
console.log(`Pronto: ${stage}`)
