import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, desc, eq, type SQL, sql } from 'drizzle-orm'
import { type Db, type DbLike, DRIZZLE, schema } from '../../common/database/index.js'
import { hoje, somarDias } from '../../common/utils/dates.js'
import { reaisParaCentavos } from '../../common/utils/money.js'
import { contem, limites, type Pagina } from '../../common/utils/pagination.js'
import { PagamentosService } from '../pagamentos/pagamentos.service.js'
import type {
  CreateOrdemServicoDto,
  OrdensServicoQueryDto,
  UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto.js'

const { ordensServico, clientes, aparelhos, telefones } = schema

@Injectable()
export class OrdensServicoService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly pagamentos: PagamentosService,
  ) {}

  listar(query: OrdensServicoQueryDto): Pagina<unknown> {
    const filtros: SQL[] = []
    if (query.clienteId) filtros.push(eq(ordensServico.clienteId, query.clienteId))
    if (query.aparelhoId) filtros.push(eq(ordensServico.aparelhoId, query.aparelhoId))

    const busca = query.busca?.trim()
    if (busca && query.campo) {
      if (query.campo === 'id') filtros.push(sql`cast(${ordensServico.id} as text) = ${busca}`)
      else if (query.campo === 'abertura') filtros.push(contem(ordensServico.abertura, busca))
      else if (query.campo === 'status') filtros.push(contem(ordensServico.status, busca))
      else if (query.campo === 'solucionado') filtros.push(contem(ordensServico.solucionado, busca))
      else {
        const centavos = reaisParaCentavos(busca)
        if (centavos !== null) filtros.push(eq(ordensServico.valor, centavos))
      }
    }

    const where = filtros.length ? and(...filtros) : undefined
    const total =
      this.db.select({ total: count() }).from(ordensServico).where(where).get()?.total ?? 0

    const items = this.db
      .select({
        id: ordensServico.id,
        abertura: ordensServico.abertura,
        fechamento: ordensServico.fechamento,
        valor: ordensServico.valor,
        taxaDeslocamento: ordensServico.taxaDeslocamento,
        status: ordensServico.status,
        solucionado: ordensServico.solucionado,
        clienteId: ordensServico.clienteId,
        clienteNome: clientes.nome,
        clienteNegativado: clientes.negativado,
        aparelhoId: ordensServico.aparelhoId,
        aparelhoNome: aparelhos.nome,
      })
      .from(ordensServico)
      .innerJoin(clientes, eq(ordensServico.clienteId, clientes.id))
      .innerJoin(aparelhos, eq(ordensServico.aparelhoId, aparelhos.id))
      .where(where)
      .orderBy(desc(ordensServico.id))
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()

    return { items, total, page: query.page, pageSize: query.pageSize }
  }

  /** OS completa, com tudo que a tela de edição e a impressão precisam. */
  buscarPorId(id: number, db: DbLike = this.db) {
    const ordemServico = db.select().from(ordensServico).where(eq(ordensServico.id, id)).get()
    if (!ordemServico) throw new NotFoundException('Ordem de serviço não encontrada')

    const cliente = db.select().from(clientes).where(eq(clientes.id, ordemServico.clienteId)).get()
    const aparelho = db
      .select()
      .from(aparelhos)
      .where(eq(aparelhos.id, ordemServico.aparelhoId))
      .get()

    return {
      ordemServico,
      cliente,
      aparelho,
      telefones: db
        .select()
        .from(telefones)
        .where(eq(telefones.clienteId, ordemServico.clienteId))
        .orderBy(telefones.id)
        .all(),
      pagamentos: this.pagamentos.daOrdem(db, id),
      ultimasOrdens: db
        .select({
          id: ordensServico.id,
          abertura: ordensServico.abertura,
          fechamento: ordensServico.fechamento,
          valor: ordensServico.valor,
          taxaDeslocamento: ordensServico.taxaDeslocamento,
          solucionado: ordensServico.solucionado,
          garantiaDias: ordensServico.garantiaDias,
        })
        .from(ordensServico)
        .where(eq(ordensServico.aparelhoId, ordemServico.aparelhoId))
        .orderBy(desc(ordensServico.id))
        .limit(5)
        .all(),
    }
  }

  criar(dto: CreateOrdemServicoDto) {
    const id = this.db.transaction((tx) => {
      const aparelho = tx.select().from(aparelhos).where(eq(aparelhos.id, dto.aparelhoId)).get()
      if (!aparelho) throw new NotFoundException('Aparelho não encontrado')
      if (aparelho.clienteId !== dto.clienteId) {
        throw new BadRequestException('Este aparelho não pertence ao cliente informado')
      }
      this.exigirFechamento(dto.status, dto.fechamento)

      const { pagamentos: itens, ...dados } = dto
      const os = tx.insert(ordensServico).values(dados).returning({ id: ordensServico.id }).get()

      this.aplicarGarantia(tx, dto.aparelhoId, dto.garantiaDias, dto.fechamento)
      this.pagamentos.criar(tx, { ordemServicoId: os.id }, itens ?? [])
      return os.id
    })
    return this.buscarPorId(id)
  }

  atualizar(id: number, dto: UpdateOrdemServicoDto) {
    this.db.transaction((tx) => {
      const atual = tx.select().from(ordensServico).where(eq(ordensServico.id, id)).get()
      if (!atual) throw new NotFoundException('Ordem de serviço não encontrada')

      const { pagamentos: itens, ...dados } = dto
      const campos = Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => valor !== undefined),
      )

      this.exigirFechamento(
        dto.status ?? atual.status,
        dto.fechamento ?? atual.fechamento ?? undefined,
      )
      if (Object.keys(campos).length > 0) {
        tx.update(ordensServico).set(campos).where(eq(ordensServico.id, id)).run()
      }
      this.aplicarGarantia(
        tx,
        atual.aparelhoId,
        dto.garantiaDias,
        dto.fechamento ?? atual.fechamento ?? undefined,
      )

      if (itens) {
        this.pagamentos.removerDaOrdem(tx, id)
        this.pagamentos.criar(tx, { ordemServicoId: id }, itens)
      }
    })
    return this.buscarPorId(id)
  }

  remover(id: number) {
    const removida = this.db
      .delete(ordensServico)
      .where(eq(ordensServico.id, id))
      .returning({ id: ordensServico.id })
      .get()
    if (!removida) throw new NotFoundException('Ordem de serviço não encontrada')
  }

  private exigirFechamento(status: string, fechamento: string | undefined) {
    if (status === 'FECHADO' && !fechamento) {
      throw new BadRequestException('Informe a data de fechamento para fechar a ordem de serviço')
    }
  }

  /** A garantia do serviço estende a garantia do aparelho a partir do fechamento (ou de hoje). */
  private aplicarGarantia(
    db: DbLike,
    aparelhoId: number,
    garantiaDias: number | undefined,
    fechamento: string | undefined,
  ) {
    if (!garantiaDias) return
    db.update(aparelhos)
      .set({ garantiaAte: somarDias(fechamento ?? hoje(), garantiaDias) })
      .where(eq(aparelhos.id, aparelhoId))
      .run()
  }
}
