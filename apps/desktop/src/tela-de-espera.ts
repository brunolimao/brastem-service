/** Página simples (sem servidor) para a janela: espera ao abrir ou aviso de falha. O texto é fixo do app. */
export const paginaSimples = (
  texto: string,
  girando: boolean,
  { detalhe, link }: { detalhe?: string; link?: { rotulo: string; endereco: string } } = {},
) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><meta charset="utf-8"><title>Brastem-Service</title>
<style>
  html,body{height:100%;margin:0;background:#0b1220;color:#fff;font:500 15px system-ui,sans-serif}
  body{display:grid;place-items:center;text-align:center;padding:0 24px}
  .anel{width:36px;height:36px;margin:0 auto 16px;border:4px solid rgba(255,255,255,.2);border-top-color:#FF6347;border-radius:50%;animation:g 1s linear infinite}
  @keyframes g{to{transform:rotate(360deg)}}
  small{display:block;margin-top:8px;color:rgba(255,255,255,.65);font-weight:400;font-size:13px}
  a{display:inline-block;margin-top:16px;padding:8px 16px;border-radius:6px;background:#FF6347;color:#fff;text-decoration:none}
</style>
<div>${girando ? '<div class="anel"></div>' : ''}${texto}${detalhe ? `<small>${detalhe}</small>` : ''}${link ? `<br><a href="${link.endereco}">${link.rotulo}</a>` : ''}</div>`)}`

/** Tela de espera: o servidor pode levar alguns segundos (ou mais, logo após instalar uma atualização). */
export const TELA_DE_ESPERA = paginaSimples('Iniciando o Brastem-Service…', true, {
  detalhe: 'Pode levar alguns segundos, principalmente logo depois de uma atualização.',
})

/** O que a tela de espera usa da BrowserWindow (injetável nos testes). */
export interface JanelaDeEspera {
  loadURL(url: string): Promise<void>
  once(evento: 'ready-to-show', ouvinte: () => void): unknown
  show(): void
  webContents: { executeJavaScript(codigo: string): Promise<unknown> }
}

/** Resolve depois que a página desenhou dois quadros, isto é, quando o que está nela já está na tela. */
const DOIS_QUADROS = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'

const dormirDeVerdade = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

/**
 * Mostra a janela já com "Iniciando…" desenhado e só então resolve. Quem chama sobe o servidor depois:
 * subir o servidor trava o processo principal por alguns segundos (carregar o sistema, backup e migração
 * do banco depois de uma atualização) e, se a página ainda não tivesse aberto, a janela ficava só com o
 * fundo azul até o fim. Com limites de tempo: se a página não abrir, mostra a janela e segue assim mesmo.
 */
export async function mostrarTelaDeEspera(
  janela: JanelaDeEspera,
  {
    pagina = TELA_DE_ESPERA,
    limite = 3000,
    dormir = dormirDeVerdade,
  }: { pagina?: string; limite?: number; dormir?: (ms: number) => Promise<void> } = {},
): Promise<void> {
  const pronta = new Promise<void>((resolver) => janela.once('ready-to-show', resolver))
  janela.loadURL(pagina).catch(() => undefined)
  await Promise.race([pronta, dormir(limite)])
  janela.show()
  // Janela recém-mostrada: espera ela desenhar de verdade antes de devolver o processo ao servidor.
  await Promise.race([
    janela.webContents.executeJavaScript(DOIS_QUADROS).catch(() => undefined),
    dormir(1000),
  ])
}
