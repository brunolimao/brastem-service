import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, desc, eq, exists, notInArray, or, type SQL, sql } from 'drizzle-orm'
import { type Db, type DbLike, DRIZZLE, schema } from '../../common/database/index.js'
import { contem, limites, type Pagina } from '../../common/utils/pagination.js'
import type {
  AparelhoDto,
  ClientesQueryDto,
  CreateClienteDto,
  TelefoneDto,
  UpdateClienteDto,
} from './dto/cliente.dto.js'

const { clientes, telefones, aparelhos } = schema

@Injectable()
export class ClientesService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  listar(query: ClientesQueryDto): Pagina<unknown> {
    const termo = query.busca?.trim()
    let where: SQL | undefined

    if (termo) {
      const campos = {
        id: sql`cast(${clientes.id} as text)`,
        nome: clientes.nome,
        email: clientes.email,
        cpf: clientes.cpf,
        endereco: clientes.endereco,
        cep: clientes.cep,
      }
      const porTelefone = exists(
        this.db
          .select({ um: sql`1` })
          .from(telefones)
          .where(and(eq(telefones.clienteId, clientes.id), contem(telefones.telefone, termo))),
      )

      if (query.campo === 'telefone') where = porTelefone
      else if (query.campo) where = contem(campos[query.campo], termo)
      else where = or(...Object.values(campos).map((campo) => contem(campo, termo)), porTelefone)
    }

    const total = this.db.select({ total: count() }).from(clientes).where(where).get()?.total ?? 0
    const items = this.db
      .select({
        id: clientes.id,
        nome: clientes.nome,
        email: clientes.email,
        cpf: clientes.cpf,
        negativado: clientes.negativado,
      })
      .from(clientes)
      .where(where)
      .orderBy(desc(clientes.id))
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()

    return { items, total, page: query.page, pageSize: query.pageSize }
  }

  buscarPorId(id: number, db: DbLike = this.db) {
    const cliente = db.select().from(clientes).where(eq(clientes.id, id)).get()
    if (!cliente) throw new NotFoundException('Cliente não encontrado')

    return {
      ...cliente,
      telefones: db
        .select()
        .from(telefones)
        .where(eq(telefones.clienteId, id))
        .orderBy(telefones.id)
        .all(),
      aparelhos: db
        .select()
        .from(aparelhos)
        .where(eq(aparelhos.clienteId, id))
        .orderBy(aparelhos.ordem)
        .all(),
    }
  }

  criar(dto: CreateClienteDto) {
    const id = this.db.transaction((tx) => {
      const { telefones: listaTelefones, aparelhos: listaAparelhos, ...dados } = dto
      const cliente = tx.insert(clientes).values(dados).returning({ id: clientes.id }).get()

      this.salvarTelefones(tx, cliente.id, listaTelefones ?? [])
      this.salvarAparelhos(tx, cliente.id, listaAparelhos ?? [])
      return cliente.id
    })
    return this.buscarPorId(id)
  }

  atualizar(id: number, dto: UpdateClienteDto) {
    this.db.transaction((tx) => {
      this.buscarPorId(id, tx)
      const { telefones: listaTelefones, aparelhos: listaAparelhos, dataCadastro, ...dados } = dto

      const campos: Record<string, unknown> = Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => valor !== undefined),
      )
      // Meio-dia em UTC (9h em Brasília): o dia não muda com o fuso, como acontecia com meia-noite.
      if (dataCadastro) campos.criadoEm = `${dataCadastro}T12:00:00.000Z`
      if (Object.keys(campos).length > 0) {
        tx.update(clientes).set(campos).where(eq(clientes.id, id)).run()
      }
      if (listaTelefones) this.salvarTelefones(tx, id, listaTelefones)
      if (listaAparelhos) this.salvarAparelhos(tx, id, listaAparelhos)
    })
    return this.buscarPorId(id)
  }

  remover(id: number) {
    const removido = this.db
      .delete(clientes)
      .where(eq(clientes.id, id))
      .returning({ id: clientes.id })
      .get()
    if (!removido) throw new NotFoundException('Cliente não encontrado')
  }

  /** Sincroniza a lista de telefones: atualiza os com id, cria os novos e remove os que sumiram. */
  private salvarTelefones(db: DbLike, clienteId: number, lista: TelefoneDto[]) {
    const mantidos = lista.flatMap((t) => (t.id ? [t.id] : []))
    db.delete(telefones)
      .where(
        and(
          eq(telefones.clienteId, clienteId),
          mantidos.length ? notInArray(telefones.id, mantidos) : undefined,
        ),
      )
      .run()

    for (const item of lista) {
      const valores = { nome: item.nome ?? '', telefone: item.telefone }
      if (item.id) {
        db.update(telefones)
          .set(valores)
          .where(and(eq(telefones.id, item.id), eq(telefones.clienteId, clienteId)))
          .run()
      } else {
        db.insert(telefones)
          .values({ ...valores, clienteId })
          .run()
      }
    }
  }

  /** Mesma lógica dos telefones. Remover um aparelho remove também as ordens de serviço dele. */
  private salvarAparelhos(db: DbLike, clienteId: number, lista: AparelhoDto[]) {
    const mantidos = lista.flatMap((a) => (a.id ? [a.id] : []))
    db.delete(aparelhos)
      .where(
        and(
          eq(aparelhos.clienteId, clienteId),
          mantidos.length ? notInArray(aparelhos.id, mantidos) : undefined,
        ),
      )
      .run()

    lista.forEach((item, indice) => {
      const valores = {
        ordem: indice + 1,
        nome: item.nome,
        marca: item.marca ?? '',
        modelo: item.modelo ?? '',
        pnc: item.pnc ?? '',
        observacao: item.observacao ?? '',
      }
      if (item.id) {
        db.update(aparelhos)
          .set(valores)
          .where(and(eq(aparelhos.id, item.id), eq(aparelhos.clienteId, clienteId)))
          .run()
      } else {
        db.insert(aparelhos)
          .values({ ...valores, clienteId })
          .run()
      }
    })
  }
}
