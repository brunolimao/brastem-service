import type { NextFunction, Request, Response } from 'express'

/** Nomes pelos quais o próprio computador chega no servidor (o app só escuta em 127.0.0.1). */
const HOSTS_LOCAIS = new Set(['127.0.0.1', 'localhost', '[::1]'])

const nomeDoHost = (host: string | undefined) => {
  if (!host) return undefined
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return undefined
  }
}

const origemLocal = (origem: string) => {
  try {
    const url = new URL(origem)
    return url.protocol === 'http:' && HOSTS_LOCAIS.has(url.hostname)
  } catch {
    return false
  }
}

/**
 * Só atende pedidos feitos ao próprio computador, vindos dele mesmo. Fecha dois caminhos que um site
 * aberto no navegador teria para mexer no app (o servidor escuta em 127.0.0.1, mas o navegador
 * consegue mandar pedidos para lá):
 * - DNS rebinding: o site faz um domínio dele apontar para 127.0.0.1; o cabeçalho Host denuncia.
 * - Formulário ou fetch de outra origem (criar o admin antes do primeiro acesso, travar o login de
 *   tanto tentar): o navegador manda o cabeçalho Origin, que aqui precisa ser local.
 */
export function acessoLocal(req: Request, res: Response, next: NextFunction) {
  if (!HOSTS_LOCAIS.has(nomeDoHost(req.headers.host) ?? '')) {
    res.status(403).json({ statusCode: 403, message: 'Acesso permitido só neste computador' })
    return
  }
  // Sem Origin: pedido do próprio app (navegação, GET) ou de fora do navegador. Origin "null" (página
  // sem origem, como um arquivo aberto do disco) nunca é o app e cai na recusa.
  const origem = req.headers.origin
  if (origem !== undefined && !origemLocal(origem)) {
    res.status(403).json({ statusCode: 403, message: 'Origem não permitida' })
    return
  }
  next()
}
