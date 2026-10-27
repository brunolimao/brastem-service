import { Inject, Injectable } from '@nestjs/common'
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { and, asc, between, count, eq, inArray } from 'drizzle-orm'
import type { AuthUser } from '../../common/auth/auth.types.js'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { ISO_DATE } from '../../common/utils/dates.js'
import { CaixaService } from '../caixa/caixa.service.js'
import { RelatoriosService } from '../relatorios/relatorios.service.js'

const { ordensServico, clientes, aparelhos } = schema

/** Status de uma OS que ainda pede trabalho (nem fechada, nem cancelada). */
export const STATUS_EM_ANDAMENTO = ['ABERTO', 'AGUARDANDO', 'APROVADO'] as const

/** Quantas OS paradas o Início mostra. */
const MAXIMO_PARADAS = 5

@Injectable()
export class PainelService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly relatorios: RelatoriosService,
    private readonly caixa: CaixaService,
  ) {}

  /**
   * Resumo do dia e do mês para o Início. Os números do financeiro (faturamento e caixa) só vão para o
   * administrador, como nas telas de caixa e relatórios; os cálculos são os mesmos delas.
   */
  resumo(usuario: AuthUser, agora = new Date()) {
    const hoje = format(agora, ISO_DATE)
    const mes = {
      inicio: format(startOfMonth(agora), ISO_DATE),
      fim: format(endOfMonth(agora), ISO_DATE),
    }
    const emAndamento = inArray(ordensServico.status, [...STATUS_EM_ANDAMENTO])

    const porStatus = Object.fromEntries(
      STATUS_EM_ANDAMENTO.map((status) => [status, 0]),
    ) as Record<(typeof STATUS_EM_ANDAMENTO)[number], number>
    for (const linha of this.db
      .select({ status: ordensServico.status, total: count() })
      .from(ordensServico)
      .where(emAndamento)
      .groupBy(ordensServico.status)
      .all()) {
      porStatus[linha.status as keyof typeof porStatus] = linha.total
    }

    const contar = (condicao: ReturnType<typeof and>) =>
      this.db.select({ total: count() }).from(ordensServico).where(condicao).get()?.total ?? 0

    const paradas = this.db
      .select({
        id: ordensServico.id,
        abertura: ordensServico.abertura,
        status: ordensServico.status,
        clienteId: ordensServico.clienteId,
        clienteNome: clientes.nome,
        aparelhoNome: aparelhos.nome,
      })
      .from(ordensServico)
      .innerJoin(clientes, eq(ordensServico.clienteId, clientes.id))
      .innerJoin(aparelhos, eq(ordensServico.aparelhoId, aparelhos.id))
      .where(emAndamento)
      .orderBy(asc(ordensServico.abertura), asc(ordensServico.id))
      .limit(MAXIMO_PARADAS)
      .all()
      .map((os) => ({ ...os, dias: differenceInCalendarDays(agora, parseISO(os.abertura)) }))

    const relatorioDoMes = this.relatorios.gerar(mes)

    return {
      hoje,
      ordens: {
        emAndamento: porStatus,
        abertasHoje: contar(eq(ordensServico.abertura, hoje)),
        fechadasNoMes: contar(
          and(
            eq(ordensServico.status, 'FECHADO'),
            between(ordensServico.fechamento, mes.inicio, mes.fim),
          ),
        ),
      },
      clientesNovosNoMes: relatorioDoMes.kpis.novosClientes,
      paradas,
      financeiro:
        usuario.role === 'admin'
          ? {
              faturamentoMes: relatorioDoMes.kpis.valorFechado,
              caixaMes: this.caixa.consultar({ ...mes, page: 1, pageSize: 1 }).total,
            }
          : undefined,
    }
  }
}
