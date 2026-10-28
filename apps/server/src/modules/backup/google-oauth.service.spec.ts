import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ConfigType } from '@nestjs/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { appConfig } from '../../common/config/app.config.js'
import { ErroOauth, GoogleOauthService } from './google-oauth.service.js'

/**
 * Conexão com o Google Drive, peça por peça (R-BKP-05, R-BKP-11). Escrito a partir do relatório de mutação:
 * o e2e (`backup.e2e-spec.ts`) passa pelo fluxo feliz; aqui ficam prazos, recusas e o que é guardado.
 */
const AGORA = new Date('2026-10-27T12:00:00.000Z')
const MINUTO = 60 * 1000

type Resposta = { status?: number; corpo: unknown }

describe('GoogleOauthService', () => {
  let pasta: string
  let respostas: Record<string, Resposta[]>
  let pedidos: {
    url: string
    metodo: string
    corpo: URLSearchParams
    cabecalhos: RequestInit['headers']
  }[]

  const criar = (ambiente: { clientId?: string; clientSecret?: string } = {}) =>
    new GoogleOauthService({
      port: 47831,
      google: ambiente,
      backup: { integracoesDir: pasta },
    } as unknown as ConfigType<typeof appConfig>)

  const salvos = () => JSON.parse(readFileSync(join(pasta, 'google.json'), 'utf8'))

  /** Pedidos ao Google respondidos em ordem, por endereço (sem a query). */
  const responder = (url: string, ...lista: Resposta[]) => {
    respostas[url] = [...(respostas[url] ?? []), ...lista]
  }
  const pedidosA = (url: string) => pedidos.filter((p) => p.url.split('?')[0] === url)

  const TOKEN = 'https://oauth2.googleapis.com/token'
  const USUARIO = 'https://www.googleapis.com/oauth2/v3/userinfo'
  const REVOGAR = 'https://oauth2.googleapis.com/revoke'

  /** Faz o caminho completo de conexão e devolve o serviço já conectado. */
  const conectar = async (servico: GoogleOauthService, token: object = {}) => {
    const url = new URL(servico.gerarUrlDeAutorizacao())
    responder(TOKEN, {
      corpo: { access_token: 'acesso-1', refresh_token: 'renovacao-1', expires_in: 3600, ...token },
    })
    responder(USUARIO, { corpo: { email: 'loja@exemplo.com' } })
    await servico.concluirAutorizacao('codigo-do-google', url.searchParams.get('state') as string)
    return url
  }

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-google-'))
    respostas = {}
    pedidos = []
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(AGORA)
    vi.stubGlobal('fetch', async (entrada: string | URL, init?: RequestInit) => {
      const url = String(entrada)
      pedidos.push({
        url,
        metodo: init?.method ?? 'GET',
        corpo: new URLSearchParams(init?.body ? String(init.body) : ''),
        cabecalhos: init?.headers ?? {},
      })
      const resposta = respostas[url.split('?')[0] as string]?.shift()
      if (!resposta) throw new Error(`sem resposta preparada para ${url}`)
      return new Response(JSON.stringify(resposta.corpo), { status: resposta.status ?? 200 })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    rmSync(pasta, { recursive: true, force: true })
  })

  describe('credenciais', () => {
    it('sem credenciais nada está configurado; as do ambiente valem; as digitadas valem mais', () => {
      expect(criar().estado()).toEqual({
        configurado: false,
        conectado: false,
        email: null,
        origemCredenciais: null,
      })
      expect(criar({ clientId: 'id-env' }).estado().configurado).toBe(false)
      expect(criar({ clientSecret: 'segredo-env' }).estado().configurado).toBe(false)

      const servico = criar({ clientId: 'id-env', clientSecret: 'segredo-env' })
      expect(servico.estado()).toMatchObject({ configurado: true, origemCredenciais: 'ambiente' })
      expect(new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('client_id')).toBe('id-env')

      servico.salvarCredenciais('id-app', 'segredo-app')
      expect(servico.estado()).toMatchObject({ configurado: true, origemCredenciais: 'app' })
      expect(new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('client_id')).toBe('id-app')
    })

    it('regravar as mesmas credenciais mantém a conexão; trocar qualquer uma desconecta', async () => {
      const servico = criar()
      servico.salvarCredenciais('id-1', 'segredo-1')
      await conectar(servico)
      servico.salvarPastaId('pasta-1')

      servico.salvarCredenciais('id-1', 'segredo-1')
      expect(salvos()).toMatchObject({ refreshToken: 'renovacao-1', pastaId: 'pasta-1' })
      expect(await servico.tokenDeAcesso()).toBe('acesso-1')

      servico.salvarCredenciais('id-1', 'segredo-2')
      expect(salvos()).toEqual({ clientId: 'id-1', clientSecret: 'segredo-2' })
      // O token de acesso guardado em memória também é esquecido.
      await expect(servico.tokenDeAcesso()).rejects.toThrow('O Google Drive não está conectado.')

      await conectar(servico)
      servico.salvarCredenciais('id-2', 'segredo-2')
      expect(salvos()).toEqual({ clientId: 'id-2', clientSecret: 'segredo-2' })
    })
  })

  describe('autorização', () => {
    it('sem credenciais não monta o endereço', () => {
      expect(() => criar().gerarUrlDeAutorizacao()).toThrow(
        'Informe o Client ID e o Client Secret do Google primeiro.',
      )
    })

    it('pede acesso contínuo, só aos arquivos do app e ao e-mail, com PKCE e retorno no próprio computador', async () => {
      const servico = criar({ clientId: 'id-env', clientSecret: 'segredo-env' })
      const url = await conectar(servico)
      expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth')
      const parametros = Object.fromEntries(url.searchParams)
      expect(parametros).toMatchObject({
        client_id: 'id-env',
        redirect_uri: 'http://127.0.0.1:47831/api/backup/google/callback',
        response_type: 'code',
        scope:
          'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent',
        code_challenge_method: 'S256',
      })

      // O código é trocado com o verificador cujo hash foi para o Google (PKCE).
      const [pedido] = pedidosA(TOKEN)
      expect(pedido?.metodo).toBe('POST')
      expect(pedido?.cabecalhos).toEqual({ 'content-type': 'application/x-www-form-urlencoded' })
      expect(Object.fromEntries(pedido?.corpo ?? [])).toMatchObject({
        grant_type: 'authorization_code',
        code: 'codigo-do-google',
        redirect_uri: 'http://127.0.0.1:47831/api/backup/google/callback',
        client_id: 'id-env',
        client_secret: 'segredo-env',
      })
      const verificador = pedido?.corpo.get('code_verifier') ?? ''
      expect(createHash('sha256').update(verificador).digest('base64url')).toBe(
        parametros.code_challenge,
      )

      // Guarda a renovação e o e-mail (lido com o token de acesso).
      expect(salvos()).toMatchObject({ refreshToken: 'renovacao-1', email: 'loja@exemplo.com' })
      expect(pedidosA(USUARIO)[0]?.cabecalhos).toEqual({ authorization: 'Bearer acesso-1' })
      expect(servico.estado()).toEqual({
        configurado: true,
        conectado: true,
        email: 'loja@exemplo.com',
        origemCredenciais: 'ambiente',
      })
    })

    it('o "state" vale uma vez só e por 10 minutos', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      const erro = 'Esta autorização expirou. Volte ao app e clique em conectar de novo.'
      await expect(servico.concluirAutorizacao('codigo', 'desconhecido')).rejects.toThrow(erro)

      const noLimite = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      vi.setSystemTime(AGORA.getTime() + 10 * MINUTO)
      responder(TOKEN, { corpo: { access_token: 'a', refresh_token: 'r' } })
      responder(USUARIO, { corpo: { email: 'x@exemplo.com' } })
      await servico.concluirAutorizacao('codigo', noLimite)
      // Usado uma vez, não vale de novo.
      await expect(servico.concluirAutorizacao('codigo', noLimite)).rejects.toThrow(erro)

      const vencido = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      vi.setSystemTime(AGORA.getTime() + 20 * MINUTO + 1)
      await expect(servico.concluirAutorizacao('codigo', vencido)).rejects.toThrow(erro)
      expect(pedidosA(TOKEN)).toHaveLength(1)
    })

    it('sem a permissão de acesso contínuo, não conecta', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      const state = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      responder(TOKEN, { corpo: { access_token: 'acesso-sem-renovacao' } })
      await expect(servico.concluirAutorizacao('codigo', state)).rejects.toThrow(
        'O Google não devolveu a permissão de acesso contínuo. Tente conectar de novo.',
      )
      expect(servico.estado().conectado).toBe(false)
      expect(pedidosA(USUARIO)).toHaveLength(0)
    })

    it('conecta mesmo se o e-mail não vier (fica sem e-mail)', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      const state = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      responder(TOKEN, { corpo: { access_token: 'a', refresh_token: 'r' } })
      responder(USUARIO, { status: 401, corpo: {} })
      await servico.concluirAutorizacao('codigo', state)
      expect(servico.estado()).toMatchObject({ conectado: true, email: null })
    })

    it('recusa do Google vira erro com o código e o detalhe', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      const state = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      responder(TOKEN, {
        status: 400,
        corpo: { error: 'invalid_client', error_description: 'Client secret errado' },
      })
      const erro = await servico.concluirAutorizacao('codigo', state).catch((e: unknown) => e)
      expect(erro).toBeInstanceOf(ErroOauth)
      expect(erro).toMatchObject({
        name: 'ErroOauth',
        codigo: 'invalid_client',
        message: 'invalid_client: Client secret errado',
      })

      const outro = new URL(servico.gerarUrlDeAutorizacao()).searchParams.get('state') as string
      responder(TOKEN, { status: 500, corpo: {} })
      await expect(servico.concluirAutorizacao('codigo', outro)).rejects.toMatchObject({
        codigo: 'erro_desconhecido',
        message: 'erro_desconhecido',
      })
    })
  })

  describe('token de acesso', () => {
    it('reaproveita até 1 minuto antes de vencer; depois renova com o refresh token', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      await conectar(servico)
      vi.setSystemTime(AGORA.getTime() + 58 * MINUTO)
      expect(await servico.tokenDeAcesso()).toBe('acesso-1')
      expect(pedidosA(TOKEN)).toHaveLength(1)

      vi.setSystemTime(AGORA.getTime() + 59 * MINUTO)
      responder(TOKEN, { corpo: { access_token: 'acesso-2' } })
      expect(await servico.tokenDeAcesso()).toBe('acesso-2')
      expect(Object.fromEntries(pedidosA(TOKEN)[1]?.corpo ?? [])).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'renovacao-1',
        client_id: 'id',
        client_secret: 'segredo',
      })
      // Sem prazo na resposta, vale 1 hora.
      vi.setSystemTime(AGORA.getTime() + 59 * MINUTO + 58 * MINUTO)
      expect(await servico.tokenDeAcesso()).toBe('acesso-2')
      expect(pedidosA(TOKEN)).toHaveLength(2)
    })

    it('acesso revogado no Google: desconecta e pede para conectar de novo (R-BKP-11)', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      await conectar(servico, { expires_in: 0 })
      servico.salvarPastaId('pasta-1')
      responder(TOKEN, { status: 400, corpo: { error: 'invalid_grant' } })
      await expect(servico.tokenDeAcesso()).rejects.toThrow(
        'O acesso ao Google Drive foi revogado. Conecte de novo.',
      )
      expect(salvos()).toEqual({ pastaId: 'pasta-1' })
      expect(servico.estado().conectado).toBe(false)
    })

    it('outros erros do Google não desconectam', async () => {
      const servico = criar({ clientId: 'id', clientSecret: 'segredo' })
      await conectar(servico, { expires_in: 0 })
      responder(TOKEN, { status: 503, corpo: { error: 'temporarily_unavailable' } })
      await expect(servico.tokenDeAcesso()).rejects.toMatchObject({
        codigo: 'temporarily_unavailable',
      })
      expect(salvos()).toMatchObject({ refreshToken: 'renovacao-1' })
    })

    it('sem conexão ou sem credenciais, avisa que não está conectado', async () => {
      await expect(criar().tokenDeAcesso()).rejects.toThrow('O Google Drive não está conectado.')
      const semRenovacao = criar({ clientId: 'id', clientSecret: 'segredo' })
      await expect(semRenovacao.tokenDeAcesso()).rejects.toThrow(
        'O Google Drive não está conectado.',
      )
    })
  })

  describe('desconectar', () => {
    it('pede ao Google para revogar e esquece conexão, e-mail e pasta, mantendo as credenciais', async () => {
      const servico = criar()
      servico.salvarCredenciais('id', 'segredo')
      await conectar(servico)
      servico.salvarPastaId('pasta-1')
      responder(REVOGAR, { corpo: {} })
      await servico.desconectar()
      const [revogacao] = pedidosA(REVOGAR)
      expect(revogacao).toMatchObject({ url: `${REVOGAR}?token=renovacao-1`, metodo: 'POST' })
      expect(salvos()).toEqual({ clientId: 'id', clientSecret: 'segredo' })
      await expect(servico.tokenDeAcesso()).rejects.toThrow('O Google Drive não está conectado.')
    })

    it('sem internet para revogar, desconecta mesmo assim; sem conexão, nem chama o Google', async () => {
      const servico = criar()
      servico.salvarCredenciais('id', 'segredo')
      await conectar(servico)
      // Sem resposta preparada: o fetch falha, como sem internet.
      await servico.desconectar()
      expect(servico.estado().conectado).toBe(false)

      await servico.desconectar()
      expect(pedidosA(REVOGAR)).toHaveLength(1)
    })
  })
})
