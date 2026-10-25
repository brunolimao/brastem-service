import { RECOMENDACOES, type Recomendacao, STATUS_OS, type StatusOS } from '@brastem/shared'
import { Inject, Injectable } from '@nestjs/common'
import { between, eq, sql } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { type PeriodoQueryDto, resolverPeriodo } from '../../common/utils/pagination.js'

const { ordensServico, clientes } = schema

const contar = <T extends string>(chaves: readonly T[], valores: T[]) => {
  const resultado = Object.fromEntries(chaves.map((chave) => [chave, 0])) as Record<T, number>
  for (const valor of valores) resultado[valor] += 1
  return resultado
}

/** Frequência por nome, ignorando vazios, da maior para a menor (formato dos gráficos de pizza). */
const frequencia = (nomes: string[]) => {
  const mapa = new Map<string, number>()
  for (const nome of nomes) if (nome) mapa.set(nome, (mapa.get(nome) ?? 0) + 1)
  return [...mapa.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

@Injectable()
export class RelatoriosService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /** OS pela data de abertura e clientes novos pela data de cadastro, no período inclusivo. */
  gerar(query: PeriodoQueryDto) {
    const periodo = resolverPeriodo(query)

    const ordens = this.db
      .select({
        id: ordensServico.id,
        status: ordensServico.status,
        valor: ordensServico.valor,
        taxaDeslocamento: ordensServico.taxaDeslocamento,
        isGarantia: ordensServico.isGarantia,
        abertura: ordensServico.abertura,
        recomendacao: clientes.recomendacao,
      })
      .from(ordensServico)
      .innerJoin(clientes, eq(ordensServico.clienteId, clientes.id))
      .where(between(ordensServico.abertura, periodo.inicio, periodo.fim))
      .orderBy(ordensServico.abertura, ordensServico.id)
      .all()

    const novos = this.db
      .select({
        recomendacao: clientes.recomendacao,
        cidade: clientes.cidade,
        bairro: clientes.bairro,
      })
      .from(clientes)
      .where(sql`substr(${clientes.criadoEm}, 1, 10) between ${periodo.inicio} and ${periodo.fim}`)
      .all()

    const faturaveis = ordens.filter((os) => !os.isGarantia)
    const total = (lista: typeof ordens) =>
      lista.reduce((soma, os) => soma + os.valor + os.taxaDeslocamento, 0)

    return {
      periodo,
      kpis: {
        valorTotal: total(faturaveis),
        valorFechado: total(faturaveis.filter((os) => os.status === 'FECHADO')),
        ordensEmGarantia: ordens.length - faturaveis.length,
        totalOrdens: ordens.length,
        novosClientes: novos.length,
      },
      status: contar<StatusOS>(
        STATUS_OS,
        ordens.map((os) => os.status),
      ),
      recomendacaoOrdens: contar<Recomendacao>(
        RECOMENDACOES,
        ordens.map((os) => os.recomendacao),
      ),
      recomendacaoClientes: contar<Recomendacao>(
        RECOMENDACOES,
        novos.map((cliente) => cliente.recomendacao),
      ),
      cidades: frequencia(novos.map((cliente) => cliente.cidade)),
      bairros: frequencia(novos.map((cliente) => cliente.bairro)),
    }
  }
}
