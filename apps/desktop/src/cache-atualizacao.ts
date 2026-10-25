import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Testa de verdade se dá para criar e renomear um arquivo na pasta. O Windows recusa o `rename`
 * (erro EXDEV) dentro de pastas criptografadas (EFS), que existem em alguns perfis de empresa, e o
 * electron-updater precisa renomear o instalador baixado.
 */
export function pastaAceitaRenomear(pasta: string): boolean {
  const origem = join(pasta, `.sonda-${process.pid}-a`)
  const destino = join(pasta, `.sonda-${process.pid}-b`)
  try {
    mkdirSync(pasta, { recursive: true })
    writeFileSync(origem, 'x')
    renameSync(origem, destino)
    return true
  } catch {
    return false
  } finally {
    rmSync(origem, { force: true })
    rmSync(destino, { force: true })
  }
}

/** A primeira pasta da lista onde o rename funciona (a ordem é a de preferência). */
export function escolherPastaDeCache(
  candidatas: string[],
  testar: (pasta: string) => boolean = pastaAceitaRenomear,
): string | undefined {
  return candidatas.find((pasta) => pasta && testar(pasta))
}
