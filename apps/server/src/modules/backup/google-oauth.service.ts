import { createHash, randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { appConfig } from '../../common/config/app.config.js'
import { ArmazenamentoJson } from './armazenamento-json.js'

const URL_AUTORIZACAO = 'https://accounts.google.com/o/oauth2/v2/auth'
const URL_TOKEN = 'https://oauth2.googleapis.com/token'
const URL_REVOGAR = 'https://oauth2.googleapis.com/revoke'
const URL_USUARIO = 'https://www.googleapis.com/oauth2/v3/userinfo'

// drive.file: o app só enxerga os arquivos que ele mesmo criou, nunca o resto do Drive do cliente.
const ESCOPOS = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
]

const VALIDADE_DA_AUTORIZACAO_MS = 10 * 60 * 1000
/** Renova o token um pouco antes de ele vencer. */
const FOLGA_DO_TOKEN_MS = 60 * 1000

interface DadosSalvos {
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  email?: string
  pastaId?: string
}

interface RespostaToken {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export interface EstadoGoogle {
  configurado: boolean
  conectado: boolean
  email: string | null
  origemCredenciais: 'app' | 'ambiente' | null
}

@Injectable()
export class GoogleOauthService {
  private readonly logger = new Logger(GoogleOauthService.name)
  private readonly armazenamento: ArmazenamentoJson<DadosSalvos>
  private readonly pendentes = new Map<string, { verificador: string; expiraEm: number }>()
  private acesso?: { token: string; expiraEm: number }

  constructor(@Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>) {
    this.armazenamento = new ArmazenamentoJson(join(config.backup.integracoesDir, 'google.json'))
  }

  private dados(): DadosSalvos {
    return this.armazenamento.ler() ?? {}
  }

  /** Credenciais digitadas na tela valem mais que as do ambiente (variáveis do instalador). */
  private credenciais():
    | { clientId: string; clientSecret: string; origem: 'app' | 'ambiente' }
    | undefined {
    const salvos = this.dados()
    if (salvos.clientId && salvos.clientSecret) {
      return { clientId: salvos.clientId, clientSecret: salvos.clientSecret, origem: 'app' }
    }
    if (this.config.google.clientId && this.config.google.clientSecret) {
      return {
        clientId: this.config.google.clientId,
        clientSecret: this.config.google.clientSecret,
        origem: 'ambiente',
      }
    }
    return undefined
  }

  /** O Google aceita redirecionar para o próprio computador (loopback) em apps do tipo "computador". */
  redirectUri() {
    return `http://127.0.0.1:${this.config.port}/api/backup/google/callback`
  }

  estado(): EstadoGoogle {
    const credenciais = this.credenciais()
    const salvos = this.dados()
    return {
      configurado: credenciais !== undefined,
      conectado: credenciais !== undefined && Boolean(salvos.refreshToken),
      email: salvos.email ?? null,
      origemCredenciais: credenciais?.origem ?? null,
    }
  }

  salvarCredenciais(clientId: string, clientSecret: string) {
    const atual = this.dados()
    const mudou = atual.clientId !== clientId || atual.clientSecret !== clientSecret
    // Outro projeto do Google invalida o token e a pasta antigos.
    this.armazenamento.gravar(
      mudou ? { clientId, clientSecret } : { ...atual, clientId, clientSecret },
    )
    if (mudou) this.acesso = undefined
  }

  /** Monta o endereço de consentimento do Google (com PKCE e `state` de uso único). */
  gerarUrlDeAutorizacao(): string {
    const credenciais = this.credenciais()
    if (!credenciais) {
      throw new BadRequestException('Informe o Client ID e o Client Secret do Google primeiro.')
    }

    this.limparExpirados()
    const state = randomBytes(24).toString('base64url')
    const verificador = randomBytes(48).toString('base64url')
    this.pendentes.set(state, { verificador, expiraEm: Date.now() + VALIDADE_DA_AUTORIZACAO_MS })

    const parametros = new URLSearchParams({
      client_id: credenciais.clientId,
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: ESCOPOS.join(' '),
      // offline + consent garantem o refresh token mesmo numa reconexão.
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: createHash('sha256').update(verificador).digest('base64url'),
      code_challenge_method: 'S256',
    })
    return `${URL_AUTORIZACAO}?${parametros}`
  }

  /** Troca o código devolvido pelo Google por tokens e guarda o refresh token. */
  async concluirAutorizacao(code: string, state: string): Promise<void> {
    const pendente = this.pendentes.get(state)
    this.pendentes.delete(state)
    if (!pendente || pendente.expiraEm < Date.now()) {
      throw new BadRequestException(
        'Esta autorização expirou. Volte ao app e clique em conectar de novo.',
      )
    }

    const credenciais = this.credenciais()
    if (!credenciais) throw new BadRequestException('Credenciais do Google não configuradas.')

    const token = await this.pedirToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri(),
      code_verifier: pendente.verificador,
      client_id: credenciais.clientId,
      client_secret: credenciais.clientSecret,
    })
    if (!token.refresh_token) {
      throw new BadRequestException(
        'O Google não devolveu a permissão de acesso contínuo. Tente conectar de novo.',
      )
    }

    this.registrarAcesso(token)
    const email = await this.buscarEmail(token.access_token as string)
    this.armazenamento.gravar({ ...this.dados(), refreshToken: token.refresh_token, email })
  }

  /** Token de acesso válido, renovando com o refresh token quando preciso. */
  async tokenDeAcesso(): Promise<string> {
    if (this.acesso && this.acesso.expiraEm - FOLGA_DO_TOKEN_MS > Date.now())
      return this.acesso.token

    const credenciais = this.credenciais()
    const { refreshToken } = this.dados()
    if (!credenciais || !refreshToken) {
      throw new ConflictException('O Google Drive não está conectado.')
    }

    try {
      const token = await this.pedirToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: credenciais.clientId,
        client_secret: credenciais.clientSecret,
      })
      this.registrarAcesso(token)
      return token.access_token as string
    } catch (erro) {
      if (erro instanceof ErroOauth && erro.codigo === 'invalid_grant') {
        // Acesso revogado (ou expirado, se o app do Google ainda está em modo de teste).
        const { refreshToken: _revogado, email: _email, ...resto } = this.dados()
        this.armazenamento.gravar(resto)
        this.acesso = undefined
        throw new ConflictException('O acesso ao Google Drive foi revogado. Conecte de novo.')
      }
      throw erro
    }
  }

  pastaId(): string | undefined {
    return this.dados().pastaId
  }

  salvarPastaId(pastaId: string) {
    this.armazenamento.gravar({ ...this.dados(), pastaId })
  }

  /** Desfaz a conexão (e pede ao Google para revogar). Mantém o Client ID/Secret. */
  async desconectar() {
    const { refreshToken, email: _email, pastaId: _pasta, ...resto } = this.dados()
    if (refreshToken) {
      await fetch(`${URL_REVOGAR}?token=${encodeURIComponent(refreshToken)}`, {
        method: 'POST',
      }).catch((erro) => this.logger.warn(`Não consegui revogar o token no Google: ${erro}`))
    }
    this.armazenamento.gravar(resto)
    this.acesso = undefined
  }

  private registrarAcesso(token: RespostaToken) {
    this.acesso = {
      token: token.access_token as string,
      expiraEm: Date.now() + (token.expires_in ?? 3600) * 1000,
    }
  }

  private async pedirToken(corpo: Record<string, string>): Promise<RespostaToken> {
    const resposta = await fetch(URL_TOKEN, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(corpo),
    })
    const json = (await resposta.json().catch(() => ({}))) as RespostaToken
    if (!resposta.ok || !json.access_token) {
      throw new ErroOauth(json.error ?? 'erro_desconhecido', json.error_description)
    }
    return json
  }

  private async buscarEmail(tokenDeAcesso: string): Promise<string | undefined> {
    const resposta = await fetch(URL_USUARIO, {
      headers: { authorization: `Bearer ${tokenDeAcesso}` },
    }).catch(() => undefined)
    if (!resposta?.ok) return undefined
    return ((await resposta.json()) as { email?: string }).email
  }

  private limparExpirados() {
    const agora = Date.now()
    for (const [state, { expiraEm }] of this.pendentes) {
      if (expiraEm < agora) this.pendentes.delete(state)
    }
  }
}

export class ErroOauth extends Error {
  constructor(
    readonly codigo: string,
    detalhe?: string,
  ) {
    super(detalhe ? `${codigo}: ${detalhe}` : codigo)
    this.name = 'ErroOauth'
  }
}
