import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Um objeto JSON num arquivo, gravado por inteiro de uma vez (nunca fica pela metade). */
export class ArmazenamentoJson<T extends object> {
  constructor(private readonly arquivo: string) {}

  ler(): T | undefined {
    if (!existsSync(this.arquivo)) return undefined
    try {
      return JSON.parse(readFileSync(this.arquivo, 'utf8')) as T
    } catch {
      // Arquivo corrompido: melhor recomeçar do zero do que travar o backup.
      return undefined
    }
  }

  gravar(valor: T) {
    mkdirSync(dirname(this.arquivo), { recursive: true })
    const temporario = `${this.arquivo}.tmp`
    writeFileSync(temporario, JSON.stringify(valor, null, 2), { mode: 0o600 })
    renameSync(temporario, this.arquivo)
  }

  remover() {
    rmSync(this.arquivo, { force: true })
  }
}
