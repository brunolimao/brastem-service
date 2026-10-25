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

  list(): UsuarioResponseDto[] {
    return this.db.select(publicColumns).from(usuarios).orderBy(usuarios.id).all()
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

  async create(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    if (this.findByUsuario(dto.usuario)) {
      throw new ConflictException('Já existe alguém com esse usuário!')
    }
    const senhaHash = await hash(dto.senha)
    return this.db
      .insert(usuarios)
      .values({ usuario: dto.usuario, senhaHash, role: dto.role })
      .returning(publicColumns)
      .get()
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
