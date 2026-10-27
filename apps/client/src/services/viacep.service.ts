export interface EnderecoCep {
  endereco: string
  bairro: string
  cidade: string
  uf: string
}

/** Sem resposta nesse tempo, a consulta desiste (o erro vira aviso na tela) em vez de ficar pendurada. */
export const TEMPO_LIMITE_CEP_MS = 8000

/** Consulta o ViaCEP (serviço público de endereços). Retorna null se o CEP não existir. */
export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(TEMPO_LIMITE_CEP_MS),
  })
  if (!resposta.ok) return null
  const dados = (await resposta.json()) as {
    erro?: boolean
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
  }
  if (dados.erro) return null
  return {
    endereco: (dados.logradouro ?? '').toUpperCase(),
    bairro: (dados.bairro ?? '').toUpperCase(),
    cidade: (dados.localidade ?? '').toUpperCase(),
    uf: (dados.uf ?? '').toUpperCase(),
  }
}
