import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, desc, eq, inArray, type SQL, sql } from 'drizzle-orm'
import { type Db, type DbLike, DRIZZLE, schema } from '../../common/database/index.js'
import { somarMeses } from '../../common/utils/dates.js'
import { dividirEmParcelas, reaisParaCentavos } from '../../common/utils/money.js'
import { contem, limites, type Pagina } from '../../common/utils/pagination.js'
import { type PagamentoInputDto, type PagamentosQueryDto } from './dto/pagamento.dto.js'

const { pagamentos, parcelas, ordensServico } = schema

export type DonoPagamento = { ordemServicoId: number } | { transacaoId: number }

@Injectable()
export class PagamentosService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /**
   * Cria pagamentos e suas parcelas. Deve rodar dentro de uma transação do chamador.
   * `sinal = -1` grava os valores negativos (despesas).
   */
  criar(db: DbLike, dono: DonoPagamento, itens: PagamentoInputDto[], sinal: 1 | -1 = 1) {
    for (const item of itens) {
      if (item.valor <= 0) continue

      const quantidade = item.parcelas ?? 0
      const valor = item.valor * sinal
      const pagamento = db
        .insert(pagamentos)
        .values({
          ordemServicoId: 'ordemServicoId' in dono ? dono.ordemServicoId : null,
          transacaoId: 'transacaoId' in dono ? dono.transacaoId : null,
          tipo: item.tipo,
          parcelas: quantidade,
          data: item.data,
          valor,
          observacao: item.observacao ?? '',
        })
        .returning({ id: pagamentos.id })
        .get()

      // Compras parceladas cobram a primeira parcela um mês depois da data informada.
      const linhas =
        quantidade === 0
          ? [{ numero: 0, data: item.data, valor }]
          : dividirEmParcelas(valor, quantidade).map((parte, indice) => ({
              numero: indice + 1,
              data: somarMeses(item.data, indice + 1),
              valor: parte,
            }))

      db.insert(parcelas)
        .values(linhas.map((linha) => ({ ...linha, pagamentoId: pagamento.id })))
        .run()
    }
  }

  removerDaOrdem(db: DbLike, ordemServicoId: number) {
    db.delete(pagamentos).where(eq(pagamentos.ordemServicoId, ordemServicoId)).run()
  }

  daOrdem(db: DbLike, ordemServicoId: number) {
    const lista = db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.ordemServicoId, ordemServicoId))
      .orderBy(pagamentos.id)
      .all()
    if (lista.length === 0) return []

    const todas = db
      .select()
      .from(parcelas)
      .where(
        inArray(
          parcelas.pagamentoId,
          lista.map((p) => p.id),
        ),
      )
      .orderBy(parcelas.numero)
      .all()

    return lista.map((pagamento) => ({
      ...pagamento,
      parcelasLista: todas.filter((parcela) => parcela.pagamentoId === pagamento.id),
    }))
  }

  parcelasDe(pagamentoId: number) {
    const existe = this.db
      .select({ id: pagamentos.id })
      .from(pagamentos)
      .where(eq(pagamentos.id, pagamentoId))
      .get()
    if (!existe) throw new NotFoundException('Pagamento não encontrado')

    return this.db
      .select()
      .from(parcelas)
      .where(eq(parcelas.pagamentoId, pagamentoId))
      .orderBy(parcelas.numero)
      .all()
  }

  listar(query: PagamentosQueryDto): Pagina<unknown> {
    const filtros: SQL[] = []

    if (query.inicio || query.fim) {
      filtros.push(
        sql`${pagamentos.data} between ${query.inicio ?? '0000-01-01'} and ${query.fim ?? '9999-12-31'}`,
      )
    }
    if (query.tipo) filtros.push(eq(pagamentos.tipo, query.tipo))

    const busca = query.busca?.trim()
    if (busca && query.campo) {
      if (query.campo === 'id') filtros.push(sql`cast(${pagamentos.id} as text) = ${busca}`)
      else if (query.campo === 'tipo') filtros.push(contem(pagamentos.tipo, busca))
      else if (query.campo === 'observacao') filtros.push(contem(pagamentos.observacao, busca))
      else {
        const centavos = reaisParaCentavos(busca)
        if (centavos !== null) filtros.push(sql`abs(${pagamentos.valor}) = ${Math.abs(centavos)}`)
      }
    }

    const where = filtros.length ? and(...filtros) : undefined
    const total = this.db.select({ total: count() }).from(pagamentos).where(where).get()?.total ?? 0

    const items = this.db
      .select({
        id: pagamentos.id,
        tipo: pagamentos.tipo,
        parcelas: pagamentos.parcelas,
        data: pagamentos.data,
        valor: pagamentos.valor,
        observacao: pagamentos.observacao,
        ordemServicoId: pagamentos.ordemServicoId,
        transacaoId: pagamentos.transacaoId,
        clienteId: ordensServico.clienteId,
        aparelhoId: ordensServico.aparelhoId,
      })
      .from(pagamentos)
      .leftJoin(ordensServico, eq(pagamentos.ordemServicoId, ordensServico.id))
      .where(where)
      .orderBy(desc(pagamentos.id))
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()

    return { items, total, page: query.page, pageSize: query.pageSize }
  }
}
