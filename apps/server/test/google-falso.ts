/** Google (OAuth + Drive) de mentira para os testes: responde pelas mesmas URLs e guarda o que recebeu. */
export interface ArquivoFalso {
  id: string
  name: string
  size: string
  createdTime: string
}

export interface GoogleFalso {
  chamadas: { metodo: string; url: string; corpo?: string }[]
  arquivos: ArquivoFalso[]
  /** Quando preenchido, o envio de arquivo falha com esse status (simula Drive/Internet com problema). */
  falharEnvioCom?: number
  /** Quando true, o token de acesso é recusado como revogado. */
  revogado: boolean
  fetch: typeof fetch
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } })

export function criarGoogleFalso(): GoogleFalso {
  const estado: GoogleFalso = {
    chamadas: [],
    arquivos: [],
    revogado: false,
    fetch: async (entrada, init) => {
      const url = String(entrada)
      const metodo = init?.method ?? 'GET'
      const corpo = init?.body ? String(init.body) : undefined
      estado.chamadas.push({ metodo, url, corpo })

      if (url === 'https://oauth2.googleapis.com/token') {
        const parametros = new URLSearchParams(corpo)
        if (parametros.get('grant_type') === 'refresh_token') {
          return estado.revogado
            ? json(
                { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' },
                400,
              )
            : json({ access_token: 'acesso-renovado', expires_in: 3600 })
        }
        return json({ access_token: 'acesso-1', refresh_token: 'refresh-1', expires_in: 3600 })
      }
      if (url.startsWith('https://oauth2.googleapis.com/revoke')) return json({})
      if (url === 'https://www.googleapis.com/oauth2/v3/userinfo')
        return json({ email: 'dono@exemplo.com' })

      if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files')) {
        if (estado.falharEnvioCom)
          return json({ error: { message: 'Falha simulada' } }, estado.falharEnvioCom)
        const nome = /"name":"([^"]+)"/.exec(corpo ?? '')?.[1] ?? 'sem-nome'
        const arquivo = {
          id: `arquivo-${estado.arquivos.length + 1}-xxxxxxxx`,
          name: nome,
          size: String(corpo?.length ?? 0),
          createdTime: new Date().toISOString(),
        }
        estado.arquivos.unshift(arquivo)
        return json(arquivo)
      }

      if (url.startsWith('https://www.googleapis.com/drive/v3/files')) {
        if (metodo === 'POST') return json({ id: 'pasta-123456789' })
        if (metodo === 'DELETE') {
          const id = decodeURIComponent(url.split('/').pop() ?? '')
          estado.arquivos = estado.arquivos.filter((arquivo) => arquivo.id !== id)
          return new Response(null, { status: 204 })
        }
        if (url.includes('pasta-123456789?')) return json({ id: 'pasta-123456789', trashed: false })
        if (url.includes('alt=media')) return new Response(Buffer.from('conteudo-do-backup'))
        // O Drive devolve do mais novo para o mais antigo (orderBy=createdTime desc).
        const ordenados = [...estado.arquivos].sort((a, b) =>
          b.createdTime.localeCompare(a.createdTime),
        )
        return json({ files: ordenados })
      }

      return json({ error: { message: `URL inesperada: ${url}` } }, 500)
    },
  }
  return estado
}
