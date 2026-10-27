// Teste de fumaça do app empacotado (R-TST-05, R-ATU-01, R-ATU-10): abre o executável de verdade, com dados vazios numa pasta
// temporária, e só passa se a janela carregar o sistema (o JavaScript da interface roda e faz pedidos
// ao servidor embutido). Pega o que os testes unitários não pegam: janela em branco, servidor que não
// sobe, arquivo faltando no instalador, travas (fuses) quebrando a abertura.
//
// Uso: node scripts/fumaca.mjs [caminho do Brastem-Service.exe]   (padrão: release/win-unpacked)
// Precisa que nenhum outro Brastem-Service esteja aberto (o app só permite uma instância).

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const exe = resolve(process.argv[2] ?? 'release/win-unpacked/Brastem-Service.exe')
const LIMITE_MS = 180_000

if (!existsSync(exe)) {
  console.error(`Executável não encontrado: ${exe}`)
  process.exit(1)
}

const dados = mkdtempSync(join(tmpdir(), 'brastem-fumaca-'))
const saida = []
const processo = spawn(exe, ['--enable-logging'], {
  env: { ...process.env, BRASTEM_PASTA_DADOS: dados },
  stdio: ['ignore', 'pipe', 'pipe'],
})
processo.stdout.on('data', (parte) => saida.push(String(parte)))
processo.stderr.on('data', (parte) => saida.push(String(parte)))
let saiu = null
processo.on('exit', (codigo) => {
  saiu = codigo
})

/** Pedidos que a janela (Electron) fez ao servidor, lidos do registro dele. */
function pedidosDaJanela() {
  const pasta = join(dados, 'logs')
  if (!existsSync(pasta)) return []
  return readdirSync(pasta)
    .flatMap((arquivo) => readFileSync(join(pasta, arquivo), 'utf8').split('\n'))
    .filter((linha) => linha.includes('"req":') && /Electron\//.test(linha))
    .map((linha) => linha.match(/"url":"([^"]+)"/)?.[1])
    .filter(Boolean)
}

async function encerrar() {
  if (saiu === null) spawnSync('taskkill', ['/PID', String(processo.pid), '/T', '/F'])
  // Espera o app soltar os arquivos (banco, logs) antes de apagar a pasta temporária.
  for (let i = 0; i < 20 && saiu === null; i++) await new Promise((r) => setTimeout(r, 250))
  try {
    rmSync(dados, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
  } catch {
    console.log(`(não consegui apagar a pasta temporária ${dados}; pode apagar depois)`)
  }
}

const inicio = Date.now()
let resultado = 'tempo esgotado'
while (Date.now() - inicio < LIMITE_MS) {
  await new Promise((resolver) => setTimeout(resolver, 1000))
  const pedidos = pedidosDaJanela()
  if (pedidos.length > 0) {
    resultado = `ok: a janela carregou em ${Math.round((Date.now() - inicio) / 1000)} s e pediu ${pedidos.join(', ')}`
    break
  }
  if (saiu !== null) {
    resultado = `o app fechou sozinho (código ${saiu}); outra instância aberta?`
    break
  }
}

const passou = resultado.startsWith('ok')
console.log(`Teste de fumaça: ${resultado}`)
if (!passou)
  console.log(`--- saída do app ---\n${saida.join('').split('\n').slice(-40).join('\n')}`)
await encerrar()
process.exit(passou ? 0 : 1)
