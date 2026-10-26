import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, desc, eq, or, type SQL, sql } from 'drizzle-orm'
import { type Db, type DbLike, DRIZZLE, schema } from '../../common/database/index.js'
import { reaisParaCentavos } from '../../common/utils/money.js'
import { contem, limites, type Pagina } from '../../common/utils/pagination.js'
import { PagamentosService } from '../pagamentos/pagamentos.service.js'
import {
  CAMPOS_BUSCA_OS,
  type CreateOrdemServicoDto,
  type OrdensServicoQueryDto,
  type UpdateOrdemServicoDto,
} from './dto/ordem-servico.dto.js'
import { recalcularGarantia } from './garantia.js'

const { ordensServico, clientes, aparelhos, telefones } = schema

/** Aceita a data como o usuário escreve ("25/10/2026", "10/2026") ou já em ISO ("2026-10"). */
export function aberturaParaBusca(busca: string) {
  const dia = busca.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dia) return `${dia[3]}-${dia[2]}-${dia[1]}`
  const mes = busca.match(/^(\d{2})\/(\d{4})$/)
  if (mes) return `${mes[2]}-${mes[1]}`
  return busca
}

/** Condição de busca para um campo, ou null quando o texto não serve para ele (ex.: "abc" como valor). */
function filtroDeBusca(campo: (typeof CAMPOS_BUSCA_OS)[number], busca: string): SQL | null {
  switch (campo) {
    case 'id':
      return /^\d+$/.test(busca) ? eq(ordensServico.id, Number(busca)) : null
    case 'abertura':
      return contem(ordensServico.abertura, aberturaParaBusca(busca))
    case 'status':
      return contem(ordensServico.status, busca)
    case 'solucionado':
      return contem(ordensServico.solucionado, busca)
    case 'valor': {
      const centavos = reaisParaCentavos(busca)
      if (centavos === null) return null
      // A lista mostra valor + taxa de deslocamento; acha por qualquer um dos dois.
      return or(
        eq(ordensServico.valor, centavos),
        sql`${ordensServico.valor} + ${ordensServico.taxaDeslocamento} = ${centavos}`,
      ) as SQL
    }
  }
}

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
    if (busca) {
      // Sem campo ("Todos"), vale qualquer um dos campos permitidos.
      const campos = query.campo ? [query.campo] : CAMPOS_BUSCA_OS
      const condicoes = campos.flatMap((campo) => filtroDeBusca(campo, busca) ?? [])
      // Nenhum campo aceita o texto (ex.: "abc" buscado como valor): nenhum resultado.
      filtros.push(condicoes.length > 0 ? (or(...condicoes) as SQL) : sql`0`)
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
      const os = tx
        .insert(ordensServico)
        .values({ ...dados, ...camposDeFechamento(dto.status) })
        .returning({ id: ordensServico.id })
        .get()

      recalcularGarantia(tx, dto.aparelhoId)
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
      // `undefined` = não mexer; `null` = limpar (ex.: apagar a garantia).
      const enviados = Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => valor !== undefined),
      ) as typeof dados
      const final = { ...atual, ...enviados }
      this.exigirFechamento(final.status, final.fechamento)

      tx.update(ordensServico)
        .set({ ...enviados, ...camposDeFechamento(final.status) })
        .where(eq(ordensServico.id, id))
        .run()
      recalcularGarantia(tx, atual.aparelhoId)

      if (itens) {
        this.pagamentos.removerDaOrdem(tx, id)
        this.pagamentos.criar(tx, { ordemServicoId: id }, itens)
      }
    })
    return this.buscarPorId(id)
  }

  remover(id: number) {
    this.db.transaction((tx) => {
      const removida = tx
        .delete(ordensServico)
        .where(eq(ordensServico.id, id))
        .returning({ aparelhoId: ordensServico.aparelhoId })
        .get()
      if (!removida) throw new NotFoundException('Ordem de serviço não encontrada')
      recalcularGarantia(tx, removida.aparelhoId)
    })
  }

  private exigirFechamento(status: string, fechamento: string | null | undefined) {
    if (status === 'FECHADO' && !fechamento) {
      throw new BadRequestException('Informe a data de fechamento para fechar a ordem de serviço')
    }
  }
}

/**
 * Fora de FECHADO não há fechamento, solução nem garantia (como no sistema antigo): reabrir uma OS
 * limpa esses campos.
 */
const camposDeFechamento = (status: string) =>
  status === 'FECHADO' ? {} : { fechamento: null, garantiaDias: null, solucionado: '' }
