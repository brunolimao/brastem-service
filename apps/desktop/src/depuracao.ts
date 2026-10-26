/**
 * Opções de linha de comando que abrem o app para depuração por fora: com elas, qualquer programa do
 * computador conseguiria ler a tela, os cookies de sessão e mandar comandos para a janela.
 * Os fuses (electron-builder.yml) já desligam o `--inspect` do Node; estas são as do Chromium.
 */
const OPCOES_DE_DEPURACAO =
  /^--(remote-debugging-port|remote-debugging-pipe|remote-debugging-address|remote-allow-origins|inspect|inspect-brk|inspect-port)(=|$)/

/** Se o app foi aberto pedindo depuração remota. O app instalado se recusa a abrir assim. */
export const pedeDepuracao = (argumentos: readonly string[]) =>
  argumentos.some((argumento) => OPCOES_DE_DEPURACAO.test(argumento))
