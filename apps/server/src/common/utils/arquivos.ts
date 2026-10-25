import { copyFileSync, renameSync, rmSync } from 'node:fs'

/**
 * Move um arquivo por cima de outro. O `rename` do Windows falha com `EXDEV` em pastas criptografadas
 * (EFS, comum em perfis de empresa) e entre discos; nesses casos copia e apaga a origem.
 */
export function moverArquivo(
  origem: string,
  destino: string,
  renomear: (de: string, para: string) => void = renameSync,
) {
  try {
    renomear(origem, destino)
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'EXDEV') throw erro
    copyFileSync(origem, destino)
    rmSync(origem, { force: true })
  }
}
