export type ValorLegado = string | number | null
export type LinhaLegada = Record<string, ValorLegado>
export type DumpLegado = Record<string, LinhaLegada[]>

const escapes: Record<string, string> = {
  '0': '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  Z: '\x1a',
  b: '\b',
}

/** Lê uma string SQL entre aspas simples a partir de `inicio` (na aspa de abertura). */
function lerTexto(sql: string, inicio: number) {
  let resultado = ''
  let i = inicio + 1
  while (i < sql.length) {
    const char = sql[i] as string
    if (char === '\\') {
      const proximo = sql[i + 1] as string
      resultado += escapes[proximo] ?? proximo
      i += 2
    } else if (char === "'") {
      if (sql[i + 1] === "'") {
        resultado += "'"
        i += 2
      } else {
        return { valor: resultado, fim: i + 1 }
      }
    } else {
      resultado += char
      i += 1
    }
  }
  throw new Error('Dump inválido: texto sem aspa de fechamento')
}

function lerLinhas(sql: string, inicio: number) {
  const linhas: ValorLegado[][] = []
  let i = inicio

  while (i < sql.length) {
    while (/[\s,]/.test(sql[i] ?? '')) i += 1
    if (sql[i] === ';') return { linhas, fim: i + 1 }
    if (sql[i] !== '(') throw new Error(`Dump inválido perto da posição ${i}`)
    i += 1

    const valores: ValorLegado[] = []
    while (true) {
      while (/\s/.test(sql[i] ?? '')) i += 1
      if (sql[i] === "'") {
        const texto = lerTexto(sql, i)
        valores.push(texto.valor)
        i = texto.fim
      } else {
        let fim = i
        while (fim < sql.length && sql[fim] !== ',' && sql[fim] !== ')') fim += 1
        const bruto = sql.slice(i, fim).trim()
        valores.push(
          bruto.toUpperCase() === 'NULL'
            ? null
            : /^-?\d+(\.\d+)?$/.test(bruto)
              ? Number(bruto)
              : bruto,
        )
        i = fim
      }
      while (/\s/.test(sql[i] ?? '')) i += 1
      if (sql[i] === ',') {
        i += 1
        continue
      }
      if (sql[i] === ')') {
        i += 1
        break
      }
      throw new Error(`Dump inválido perto da posição ${i}`)
    }
    linhas.push(valores)
  }
  throw new Error('Dump inválido: INSERT sem ponto e vírgula final')
}

/** Lê um dump do mysqldump (CREATE TABLE + INSERT) e devolve as linhas por tabela, com os nomes das colunas. */
export function lerDump(sql: string): DumpLegado {
  const colunasPorTabela = new Map<string, string[]>()
  for (const match of sql.matchAll(/CREATE TABLE `(\w+)` \(([\s\S]*?)\n\) ENGINE/g)) {
    const colunas = [...(match[2] ?? '').matchAll(/^\s+`(\w+)`\s/gm)].map((m) => m[1] as string)
    colunasPorTabela.set(match[1] as string, colunas)
  }

  const dump: DumpLegado = {}
  for (const match of sql.matchAll(/INSERT INTO `(\w+)` (?:\(([^)]*)\) )?VALUES /g)) {
    const tabela = match[1] as string
    const colunas = match[2]
      ? match[2].split(',').map((c) => c.trim().replaceAll('`', ''))
      : colunasPorTabela.get(tabela)
    if (!colunas) throw new Error(`INSERT na tabela ${tabela} sem CREATE TABLE correspondente`)

    const { linhas } = lerLinhas(sql, (match.index ?? 0) + match[0].length)
    const destino = dump[tabela] ?? []
    for (const valores of linhas) {
      destino.push(
        Object.fromEntries(colunas.map((coluna, indice) => [coluna, valores[indice] ?? null])),
      )
    }
    dump[tabela] = destino
  }
  return dump
}

/** Decodifica o arquivo do dump. O redirecionamento `>` do PowerShell grava em UTF-16, o mysqldump normal em UTF-8. */
export function decodificarDump(conteudo: Buffer): string {
  if (conteudo[0] === 0xff && conteudo[1] === 0xfe) return conteudo.toString('utf16le').slice(1)
  if (conteudo[0] === 0xef && conteudo[1] === 0xbb && conteudo[2] === 0xbf) {
    return conteudo.toString('utf8').slice(1)
  }
  return conteudo.toString('utf8')
}
