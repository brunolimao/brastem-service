import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '@brastem/shared'
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, desc, eq, type SQL, sql } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import { limites, type Pagina } from '../../common/utils/pagination.js'
import { PagamentosService } from '../pagamentos/pagamentos.service.js'
import type { CreateTransacaoDto, TransacoesQueryDto } from './dto/transacao.dto.js'

const { transacoes } = schema

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const reais = (centavos: number) => moeda.format(centavos / 100)

const categoriasPorTipo: Record<string, readonly string[]> = {
  receita: CATEGORIAS_RECEITA,
  despesa: CATEGORIAS_DESPESA,
}

@Injectable()
export class TransacoesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly pagamentos: PagamentosService,
  ) {}

  criar(dto: CreateTransacaoDto) {
    if (!categoriasPorTipo[dto.tipo]?.includes(dto.categoria)) {
      throw new BadRequestException(`Categoria inválida para ${dto.tipo}`)
    }
    // O caixa soma os pagamentos: se não fecharem com o valor, a transação diria uma coisa e o caixa outra.
    const somaPagamentos = dto.pagamentos?.reduce((soma, pagamento) => soma + pagamento.valor, 0)
    if (dto.pagamentos?.length && somaPagamentos !== dto.valor) {
      throw new BadRequestException(
        `A soma dos pagamentos (${reais(somaPagamentos ?? 0)}) é diferente do valor (${reais(dto.valor)})`,
      )
    }

    const id = this.db.transaction((tx) => {
      const { pagamentos: itens, ...dados } = dto
      const transacao = tx.insert(transacoes).values(dados).returning({ id: transacoes.id }).get()

      const pagamentos = itens?.length
        ? itens
        : [{ valor: dto.valor, tipo: 'dinheiro' as const, parcelas: 0, data: dto.data }]
      this.pagamentos.criar(
        tx,
        { transacaoId: transacao.id },
        pagamentos,
        dto.tipo === 'despesa' ? -1 : 1,
      )
      return transacao.id
    })

    return this.buscarPorId(id)
  }

  buscarPorId(id: number) {
    const transacao = this.db.select().from(transacoes).where(eq(transacoes.id, id)).get()
    if (!transacao) throw new NotFoundException('Transação não encontrada')
    return transacao
  }

  listar(query: TransacoesQueryDto): Pagina<unknown> {
    const filtros: SQL[] = []
    if (query.inicio || query.fim) {
      filtros.push(
        sql`${transacoes.data} between ${query.inicio ?? '0000-01-01'} and ${query.fim ?? '9999-12-31'}`,
      )
    }
    if (query.tipo) filtros.push(eq(transacoes.tipo, query.tipo))

    const where = filtros.length ? and(...filtros) : undefined
    const total = this.db.select({ total: count() }).from(transacoes).where(where).get()?.total ?? 0
    const items = this.db
      .select()
      .from(transacoes)
      .where(where)
      .orderBy(desc(transacoes.data), desc(transacoes.id))
      .limit(limites(query).limit)
      .offset(limites(query).offset)
      .all()

    return { items, total, page: query.page, pageSize: query.pageSize }
  }

  remover(id: number) {
    const removida = this.db
      .delete(transacoes)
      .where(eq(transacoes.id, id))
      .returning({ id: transacoes.id })
      .get()
    if (!removida) throw new NotFoundException('Transação não encontrada')
  }
}
