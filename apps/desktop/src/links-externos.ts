/**
 * Endereços que o app pode abrir no navegador do sistema. Só o login do Google (backup no Drive):
 * qualquer outro link, mesmo que apareça na tela por algum defeito, fica bloqueado.
 */
const SITES_EXTERNOS = new Set(['accounts.google.com'])

export function podeAbrirFora(endereco: string) {
  try {
    const url = new URL(endereco)
    return url.protocol === 'https:' && SITES_EXTERNOS.has(url.hostname)
  } catch {
    return false
  }
}
