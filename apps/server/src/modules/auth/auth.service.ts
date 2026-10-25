import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { hash, verify } from '@node-rs/argon2'
import { addDays } from 'date-fns'
import { and, eq } from 'drizzle-orm'
import type { AccessPayload } from '../../common/auth/auth.types.js'
import { appConfig } from '../../common/config/app.config.js'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { UsuariosService } from '../usuarios/usuarios.service.js'

const { refreshTokens } = schema

export interface Session {
  accessToken: string
  refreshToken: string
  user: { id: number; usuario: string; role: AccessPayload['role'] }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>

  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly jwt: JwtService,
    private readonly usuarios: UsuariosService,
  ) {}

  needsSetup() {
    return this.usuarios.total() === 0
  }

  async setup(usuario: string, senha: string) {
    if (!this.needsSetup()) throw new ForbiddenException('O sistema já foi configurado')
    await this.usuarios.create({ usuario, senha, role: 'admin' })
  }

  async login(usuario: string, senha: string): Promise<Session> {
    const user = this.usuarios.findByUsuario(usuario)
    // Compara contra um hash falso quando o usuário não existe, para não vazar essa informação pelo tempo de resposta.
    const hashToCheck = user?.senhaHash ?? (await this.getDummyHash())
    const valid = await verify(hashToCheck, senha).catch(() => false)
    if (!user?.ativo || !valid) throw new UnauthorizedException('Usuário ou senha inválidos')
    return this.createSession(user)
  }

  private getDummyHash() {
    if (!this.dummyHash) this.dummyHash = hash('senha-inexistente')
    return this.dummyHash
  }

  async refresh(rawToken: string | undefined): Promise<Session> {
    const invalid = new UnauthorizedException('Sessão expirada. Faça login novamente')
    const [id, secret] = rawToken?.split('.') ?? []
    if (!id || !secret) throw invalid

    const stored = this.db.select().from(refreshTokens).where(eq(refreshTokens.id, id)).get()
    if (!stored) throw invalid

    const matches =
      Buffer.from(stored.tokenHash).length === Buffer.from(sha256(secret)).length &&
      timingSafeEqual(Buffer.from(stored.tokenHash), Buffer.from(sha256(secret)))
    if (!matches) throw invalid

    if (stored.revogado) {
      // Token já usado sendo reapresentado: possível roubo, derruba todas as sessões do usuário.
      this.revokeAll(stored.usuarioId)
      throw invalid
    }
    if (new Date(stored.expiraEm) < new Date()) throw invalid

    const user = this.usuarios.findById(stored.usuarioId)
    if (!user?.ativo) throw invalid

    this.db.update(refreshTokens).set({ revogado: true }).where(eq(refreshTokens.id, id)).run()
    return this.createSession(user)
  }

  logout(rawToken: string | undefined) {
    const id = rawToken?.split('.')[0]
    if (id)
      this.db.update(refreshTokens).set({ revogado: true }).where(eq(refreshTokens.id, id)).run()
  }

  private revokeAll(usuarioId: number) {
    this.db
      .update(refreshTokens)
      .set({ revogado: true })
      .where(and(eq(refreshTokens.usuarioId, usuarioId), eq(refreshTokens.revogado, false)))
      .run()
  }

  private async createSession(user: { id: number; usuario: string; role: AccessPayload['role'] }) {
    const payload: AccessPayload = { sub: user.id, usuario: user.usuario, role: user.role }
    const accessToken = await this.jwt.signAsync(payload)

    const id = randomUUID()
    const secret = randomBytes(32).toString('base64url')
    this.db
      .insert(refreshTokens)
      .values({
        id,
        usuarioId: user.id,
        tokenHash: sha256(secret),
        expiraEm: addDays(new Date(), this.config.jwt.refreshTtlDays).toISOString(),
      })
      .run()

    return {
      accessToken,
      refreshToken: `${id}.${secret}`,
      user: { id: user.id, usuario: user.usuario, role: user.role },
    } satisfies Session
  }
}
