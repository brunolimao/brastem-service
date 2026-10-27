import { TIPOS_PAGAMENTO } from '@brastem/shared'
import { Inject, Injectable } from '@nestjs/common'
import { asc, between, count, eq, sum } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { limites, ordenar, resolverPeriodo } from '../../common/utils/pagination.js'
import type { CaixaQueryDto } from './dto/caixa.dto.js'

const { parcelas, pagamentos, ordensServico, transacoes } = schema

@Injectable()
export class CaixaService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /**
   * O caixa é o conjunto de parcelas que vencem (ou entram) no período, inclusive nas duas pontas.
   * O total e a contagem por forma de pagamento valem para o período inteiro; a lista vem paginada.
   */
  consultar(query: CaixaQueryDto) {
    const periodo = resolverPeriodo(query)
    const noPeriodo = between(parcelas.data, periodo.inicio, periodo.fim)

    const porForma = this.db
      .select({ tipo: pagamentos.tipo, quantidade: count(), soma: sum(parcelas.valor) })
      .from(parcelas)
      .innerJoin(pagamentos, eq(parcelas.pagamentoId, pagamentos.id))
      .where(noPeriodo)
      .groupBy(pagamentos.tipo)
      .all()
    const formas = Object.fromEntries(TIPOS_PAGAMENTO.map((tipo) => [tipo, 0])) as Record<
      (typeof TIPOS_PAGAMENTO)[number],
      number
    >
    for (const linha of porForma) formas[linha.tipo] = linha.quantidade

    const itens = this.db
      .select({
        id: parcelas.id,
        valor: parcelas.valor,
        data: parcelas.data,
        numero: parcelas.numero,
        totalParcelas: pagamentos.parcelas,
        tipo: pagamentos.tipo,
        observacao: pagamentos.observacao,
        pagamentoId: pagamentos.id,
        ordemServicoId: pagamentos.ordemServicoId,
        clienteId: ordensServico.clienteId,
        aparelhoId: ordensServico.aparelhoId,
        transacaoId: pagamentos.transacaoId,
        categoria: transacoes.categoria,
        descricao: transacoes.descricao,
      })
      .from(parcelas)
      .innerJoin(pagamentos, eq(parcelas.pagamentoId, pagamentos.id))
      .leftJoin(ordensServico, eq(pagamentos.ordemServicoId, ordensServico.id))
      .leftJoin(transacoes, eq(pagamentos.transacaoId, transacoes.id))
      .where(noPeriodo)
      .orderBy(
        ...ordenar(
          query,
          {
            id: parcelas.id,
            data: parcelas.data,
            valor: parcelas.valor,
            tipo: pagamentos.tipo,
          },
          parcelas.id,
          [asc(parcelas.data), asc(parcelas.id)],
        ),
      )
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()

    return {
      periodo,
      /** Saldo do período em centavos (receitas menos despesas). */
      total: porForma.reduce((soma, linha) => soma + Number(linha.soma ?? 0), 0),
      formas,
      itens,
      /** Quantidade de lançamentos no período (para a paginação). */
      quantidade: porForma.reduce((soma, linha) => soma + linha.quantidade, 0),
      page: query.page,
      pageSize: query.pageSize,
    }
  }
}
