export interface OpcoesCarregamento {
  /** Quantas vezes tentar no total antes de desistir. */
  tentativas?: number
  /** Espera antes da tentativa `n` (1, 2, ...), em milissegundos. */
  espera?: (tentativa: number) => number
  /** Injetável nos testes. */
  dormir?: (ms: number) => Promise<void>
  registrar?: (mensagem: string) => void
}

const dormirDeVerdade = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

/**
 * Carrega o endereço tentando de novo quando falha. Na primeira abertura de um executável novo, o
 * serviço de rede do Chromium pode cair e reiniciar; o carregamento daquele instante falha e, sem
 * nova tentativa, a janela ficava em branco para sempre. Devolve se conseguiu carregar.
 */
export async function carregarComNovasTentativas(
  carregar: (endereco: string) => Promise<unknown>,
  endereco: string,
  {
    tentativas = 6,
    espera = (tentativa) => Math.min(500 * 2 ** (tentativa - 1), 5000),
    dormir = dormirDeVerdade,
    registrar = () => undefined,
  }: OpcoesCarregamento = {},
): Promise<boolean> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      await carregar(endereco)
      return true
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      registrar(`Falha ao carregar a janela (tentativa ${tentativa} de ${tentativas}): ${motivo}`)
      if (tentativa < tentativas) await dormir(espera(tentativa))
    }
  }
  return false
}
