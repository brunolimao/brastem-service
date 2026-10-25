import { TIPOS_PAGAMENTO } from '@brastem/shared'
import { Inject, Injectable } from '@nestjs/common'
import { between, eq } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { type PeriodoQueryDto, resolverPeriodo } from '../../common/utils/pagination.js'

const { parcelas, pagamentos, ordensServico, transacoes } = schema

@Injectable()
export class CaixaService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /** O caixa é o conjunto de parcelas que vencem (ou entram) no período, inclusive nas duas pontas. */
  consultar(query: PeriodoQueryDto) {
    const periodo = resolverPeriodo(query)

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
      .where(between(parcelas.data, periodo.inicio, periodo.fim))
      .orderBy(parcelas.data, parcelas.id)
      .all()

    const formas = Object.fromEntries(TIPOS_PAGAMENTO.map((tipo) => [tipo, 0])) as Record<
      (typeof TIPOS_PAGAMENTO)[number],
      number
    >
    for (const item of itens) formas[item.tipo] += 1

    return {
      periodo,
      total: itens.reduce((soma, item) => soma + item.valor, 0),
      formas,
      itens,
    }
  }
}
