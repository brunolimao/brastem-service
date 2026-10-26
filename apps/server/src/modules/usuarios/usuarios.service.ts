import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { hash } from '@node-rs/argon2'
import { count, eq } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { limites, type Pagina, type PaginacaoQueryDto } from '../../common/utils/pagination.js'
import type { CreateUsuarioDto, UsuarioResponseDto } from './dto/usuario.dto.js'

const { usuarios } = schema

const publicColumns = {
  id: usuarios.id,
  usuario: usuarios.usuario,
  role: usuarios.role,
  ativo: usuarios.ativo,
  criadoEm: usuarios.criadoEm,
}

@Injectable()
export class UsuariosService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  list(query: PaginacaoQueryDto): Pagina<UsuarioResponseDto> {
    const items = this.db
      .select(publicColumns)
      .from(usuarios)
      .orderBy(usuarios.id)
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()
    return { items, total: this.total(), page: query.page, pageSize: query.pageSize }
  }

  total(): number {
    return this.db.select({ total: count() }).from(usuarios).get()?.total ?? 0
  }

  findByUsuario(usuario: string) {
    return this.db.select().from(usuarios).where(eq(usuarios.usuario, usuario)).get()
  }

  findById(id: number) {
    return this.db.select().from(usuarios).where(eq(usuarios.id, id)).get()
  }

  /**
   * O hash (lento, assíncrono) vem antes; checar e gravar ficam juntos numa transação síncrona, então
   * dois cadastros ao mesmo tempo não passam os dois pela checagem (antes: 500 de UNIQUE ou dois admins).
   * `somenteSeVazio` é o primeiro acesso: só cria se ainda não houver nenhum usuário.
   */
  async create(
    dto: CreateUsuarioDto,
    { somenteSeVazio = false } = {},
  ): Promise<UsuarioResponseDto> {
    const senhaHash = await hash(dto.senha)
    return this.db.transaction((tx) => {
      if (somenteSeVazio && (tx.select({ total: count() }).from(usuarios).get()?.total ?? 0) > 0) {
        throw new ForbiddenException('O sistema já foi configurado')
      }
      if (tx.select().from(usuarios).where(eq(usuarios.usuario, dto.usuario)).get()) {
        throw new ConflictException('Já existe alguém com esse usuário!')
      }
      return tx
        .insert(usuarios)
        .values({ usuario: dto.usuario, senhaHash, role: dto.role })
        .returning(publicColumns)
        .get()
    })
  }

  remove(id: number, currentUserId: number) {
    if (id === currentUserId) throw new ForbiddenException('Não pode apagar você mesmo!')
    const removed = this.db
      .delete(usuarios)
      .where(eq(usuarios.id, id))
      .returning({ id: usuarios.id })
      .get()
    if (!removed) throw new NotFoundException('Usuário não encontrado')
  }
}
