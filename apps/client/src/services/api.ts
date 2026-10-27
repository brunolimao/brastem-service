type ValorQuery = string | number | boolean | null | undefined

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
    /** A sessão caiu e não deu para renovar; a tela de login é tratada à parte. */
    readonly sessaoExpirada = false,
  ) {
    super(messages[0] ?? 'Erro inesperado')
    this.name = 'ApiError'
  }
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Arquivo enviado como bytes crus (application/octet-stream) em vez de JSON. */
  arquivo?: Blob
  query?: Record<string, ValorQuery>
}

let aoExpirarSessao: (() => void) | undefined
let renovando: Promise<boolean> | undefined

/** Registra o que fazer quando a sessão expira de vez (limpar o estado e voltar ao login). */
export const configurarApi = (config: { aoExpirarSessao: () => void }) => {
  aoExpirarSessao = config.aoExpirarSessao
}

const montarQuery = (query: Opcoes['query']) => {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, String(valor))
  }
  const texto = params.toString()
  return texto ? `?${texto}` : ''
}

/** Várias chamadas simultâneas com 401 compartilham uma única renovação. */
function renovarSessao() {
  renovando ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    .then((resposta) => resposta.ok)
    .catch(() => false)
    .finally(() => {
      renovando = undefined
    })
  return renovando
}

async function lerErro(resposta: Response, sessaoExpirada = false) {
  const corpo = (await resposta.json().catch(() => null)) as { message?: string | string[] } | null
  const mensagens = [corpo?.message ?? []].flat()
  return new ApiError(
    resposta.status,
    mensagens.length > 0 ? mensagens : ['Erro inesperado. Tente novamente.'],
    sessaoExpirada,
  )
}

const ROTAS_DE_AUTENTICACAO = ['/auth/login', '/auth/refresh', '/auth/setup']

export async function api<T>(
  caminho: string,
  { method = 'GET', body, arquivo, query }: Opcoes = {},
) {
  const enviar = () =>
    fetch(`/api${caminho}${montarQuery(query)}`, {
      method,
      credentials: 'same-origin',
      ...(arquivo
        ? { headers: { 'content-type': 'application/octet-stream' }, body: arquivo }
        : body === undefined
          ? {}
          : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    })

  const enviarOuFalhar = () =>
    enviar().catch(() => {
      throw new ApiError(0, ['Não foi possível conectar ao servidor.'])
    })

  let resposta = await enviarOuFalhar()

  if (resposta.status === 401 && !ROTAS_DE_AUTENTICACAO.includes(caminho)) {
    if (await renovarSessao()) {
      resposta = await enviarOuFalhar()
    } else {
      aoExpirarSessao?.()
      throw await lerErro(resposta, true)
    }
  }

  if (!resposta.ok) throw await lerErro(resposta)
  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}
