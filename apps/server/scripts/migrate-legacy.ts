import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { abrirSqlite, criarDb, migrarSchema } from '../src/common/database/connection.js'
import { decodificarDump, lerDump } from '../src/legacy/dump-parser.js'
import { migrarDoDump } from '../src/legacy/migrar.js'

const uso = 'Uso: pnpm --filter @brastem/server migrate:legacy -- <dump.sql> [--data-dir <pasta>]'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const indiceDataDir = args.indexOf('--data-dir')
const dataDir = resolve(indiceDataDir >= 0 ? (args[indiceDataDir + 1] ?? '') : './data')
const arquivoDump = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--data-dir')

if (!arquivoDump || !existsSync(arquivoDump)) {
  console.error(arquivoDump ? `Arquivo não encontrado: ${arquivoDump}` : uso)
  process.exit(1)
}

const destino = join(dataDir, 'brastem.sqlite')
console.log(`Lendo ${arquivoDump}...`)
const dump = lerDump(decodificarDump(readFileSync(arquivoDump)))

const sqlite = abrirSqlite(destino)
const db = criarDb(sqlite)
migrarSchema(db)

try {
  console.log(`Importando para ${destino}...`)
  const relatorio = await migrarDoDump(db, dump)

  console.table(relatorio.tabelas)
  const reais = (centavos: number) =>
    (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  console.log('\nTotais para conferir com o sistema antigo:')
  console.log(`  Valor das OS (valor + deslocamento): ${reais(relatorio.totais.ordensServico)}`)
  console.log(`  Soma dos pagamentos:                 ${reais(relatorio.totais.pagamentos)}`)
  console.log(`  Soma das parcelas:                   ${reais(relatorio.totais.parcelas)}`)

  if (relatorio.avisos.length > 0) {
    console.log(`\nAvisos (${relatorio.avisos.length}):`)
    for (const aviso of relatorio.avisos) console.log(`  - ${aviso}`)
  }
} catch (erro) {
  console.error(`\nFalha na migração: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  sqlite.close()
}
