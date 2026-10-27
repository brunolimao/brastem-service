// Confere que toda regra da especificação (R-XXX-NN) é citada por algum teste (R-TST-03), ou está
// declarada na seção Testes do arquivo dela numa linha "- Sem teste automatizado: R-XXX-NN (motivo)".
// Uso: `pnpm regras`. Sai com erro e lista as regras sem teste.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const CODIGO = /R-[A-Z]+-\d+/g
const DEFINICAO = /\*\*(R-[A-Z]+-\d+)\*\*/g
const ARQUIVO_DE_TESTE = /(\.(spec|e2e-spec|test|visual)\.(ts|tsx|mjs)|[\\/]fumaca\.mjs)$/
const IGNORADAS = new Set(['node_modules', 'dist', 'coverage', 'release', '.stage', '.turbo'])

/** Arquivos de uma pasta, recursivamente, sem as pastas geradas. */
export function listar(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    if (IGNORADAS.has(item.name)) return []
    const caminho = join(pasta, item.name)
    return item.isDirectory() ? listar(caminho) : [caminho]
  })
}

/** Regras definidas e regras declaradas sem teste automatizado, num texto da especificação. */
export function lerEspecificacao(texto) {
  const definidas = [...texto.matchAll(DEFINICAO)].map((m) => m[1])
  // O item pode continuar nas linhas seguintes, recuadas (como em toda lista da especificação).
  const isentas = []
  let dentro = false
  for (const linha of texto.split('\n')) {
    if (linha.startsWith('- ')) dentro = linha.startsWith('- Sem teste automatizado:')
    else if (!linha.startsWith('  ')) dentro = false
    if (dentro) isentas.push(...(linha.match(CODIGO) ?? []))
  }
  return { definidas, isentas }
}

/** Regras definidas que nenhum teste cita e que não estão declaradas como sem teste. */
export function regrasSemTeste({ especificacoes, testes }) {
  const citadas = new Set(testes.flatMap((texto) => texto.match(CODIGO) ?? []))
  const isentas = new Set()
  const definidas = []
  for (const texto of especificacoes) {
    const lido = lerEspecificacao(texto)
    definidas.push(...lido.definidas)
    for (const codigo of lido.isentas) isentas.add(codigo)
  }
  return [...new Set(definidas)].filter((codigo) => !citadas.has(codigo) && !isentas.has(codigo))
}

function principal() {
  const especificacoes = listar(join(RAIZ, 'docs', 'especificacao'))
    // `_modelo-modulo.md` é o modelo, com regras de exemplo.
    .filter((arquivo) => arquivo.endsWith('.md') && !/[\\/]_/.test(relative(RAIZ, arquivo)))
    .map((arquivo) => readFileSync(arquivo, 'utf8'))
  const testes = ['apps', 'packages', 'scripts']
    .flatMap((pasta) => listar(join(RAIZ, pasta)))
    .filter((arquivo) => ARQUIVO_DE_TESTE.test(arquivo))
    .map((arquivo) => readFileSync(arquivo, 'utf8'))

  const faltando = regrasSemTeste({ especificacoes, testes })
  if (faltando.length > 0) {
    console.error(
      `Regras sem teste que as cite (${faltando.length}): ${faltando.join(', ')}\n` +
        'Cite o código no nome do teste ou num comentário, ou declare na seção Testes do arquivo da ' +
        'regra: "- Sem teste automatizado: R-XXX-NN (motivo)".',
    )
    process.exitCode = 1
    return
  }
  console.log('Toda regra da especificação tem teste (ou está declarada sem teste automatizado).')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) principal()
