import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'

/** Porta fixa de preferência: o endereço (e com ele o tema salvo no navegador) fica o mesmo entre aberturas. */
export const PORTA_PREFERIDA = 47831

const TAMANHO_MINIMO_SEGREDO = 32

/**
 * O segredo que assina os tokens de login nasce na primeira abertura e fica na pasta de dados do usuário.
 * Assim ele não vai no instalador nem no código.
 */
export function carregarOuCriarSegredo(pastaDados: string): string {
  mkdirSync(pastaDados, { recursive: true })
  const arquivo = join(pastaDados, 'segredo.key')

  if (existsSync(arquivo)) {
    const existente = readFileSync(arquivo, 'utf8').trim()
    if (existente.length >= TAMANHO_MINIMO_SEGREDO) return existente
  }

  const segredo = randomBytes(48).toString('hex')
  writeFileSync(arquivo, segredo, { mode: 0o600 })
  return segredo
}

function portaEstaLivre(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const servidor = createServer()
    servidor.once('error', () => resolve(false))
    servidor.listen(porta, '127.0.0.1', () => servidor.close(() => resolve(true)))
  })
}

/** Usa a porta preferida se estiver livre; senão pede uma qualquer ao sistema. */
export async function escolherPorta(preferida = PORTA_PREFERIDA): Promise<number> {
  if (await portaEstaLivre(preferida)) return preferida

  return new Promise((resolve, reject) => {
    const servidor = createServer()
    servidor.once('error', reject)
    servidor.listen(0, '127.0.0.1', () => {
      const endereco = servidor.address()
      const porta = typeof endereco === 'object' && endereco ? endereco.port : 0
      servidor.close(() => (porta ? resolve(porta) : reject(new Error('Sem porta disponível'))))
    })
  })
}

export interface OpcoesAmbiente {
  pastaDados: string
  pastaInterface: string
  segredo: string
  porta: number
}

/** Variáveis de ambiente do servidor embutido. Só escuta em 127.0.0.1, nunca na rede. */
export function montarAmbiente({
  pastaDados,
  pastaInterface,
  segredo,
  porta,
}: OpcoesAmbiente): Record<string, string> {
  return {
    NODE_ENV: 'production',
    HOST: '127.0.0.1',
    PORT: String(porta),
    DATA_DIR: pastaDados,
    CLIENT_DIR: pastaInterface,
    JWT_SECRET: segredo,
    LOG_LEVEL: 'info',
    SWAGGER_ENABLED: 'false',
    COOKIE_SECURE: 'false',
  }
}
