import { describe, expect, it } from 'vitest'
import { abrirSqlite, criarDb, migrarSchema } from '../../common/database/connection.js'
import { schema } from '../../common/database/index.js'
import { PagamentosService } from '../pagamentos/pagamentos.service.js'
import { TransacoesService } from '../transacoes/transacoes.service.js'
import { OrdensServicoService } from './ordens-servico.service.js'

/** Pagamentos que estouram depois de a OS (ou o lançamento) já ter sido inserida. */
class PagamentosQueFalham extends PagamentosService {
  override criar(): void {
    throw new Error('falha ao gravar as parcelas')
  }
}

const novoBanco = () => {
  const db = criarDb(abrirSqlite(':memory:'))
  migrarSchema(db)
  db.insert(schema.clientes).values({ id: 1, nome: 'Maria' }).run()
  db.insert(schema.aparelhos).values({ id: 1, clienteId: 1, nome: 'Geladeira' }).run()
  return db
}

const pagamento = { valor: 10000, tipo: 'pix' as const, parcelas: 0, data: '2026-10-01' }

describe('gravação de OS e lançamento é tudo ou nada (R-PAG-05, R-DAD-05)', () => {
  it('OS: se os pagamentos falham, a OS não fica gravada', () => {
    const db = novoBanco()
    const servico = new OrdensServicoService(db, new PagamentosQueFalham(db))
    expect(() =>
      servico.criar({
        clienteId: 1,
        aparelhoId: 1,
        status: 'ABERTO',
        valor: 10000,
        abertura: '2026-10-01',
        pagamentos: [pagamento],
      }),
    ).toThrow('falha ao gravar as parcelas')
    expect(db.select().from(schema.ordensServico).all()).toEqual([])
  })

  it('edição da OS: se os novos pagamentos falham, os antigos e a OS ficam como estavam', () => {
    const db = novoBanco()
    const os = new OrdensServicoService(db, new PagamentosService(db)).criar({
      clienteId: 1,
      aparelhoId: 1,
      status: 'ABERTO',
      valor: 10000,
      abertura: '2026-10-01',
      pagamentos: [pagamento],
    }).ordemServico
    const servico = new OrdensServicoService(db, new PagamentosQueFalham(db))
    expect(() => servico.atualizar(os.id, { valor: 99999, pagamentos: [pagamento] })).toThrow()
    expect(db.select().from(schema.ordensServico).get()?.valor).toBe(10000)
    expect(db.select().from(schema.pagamentos).all()).toHaveLength(1)
    expect(db.select().from(schema.parcelas).all()).toHaveLength(1)
  })

  it('lançamento: se os pagamentos falham, a receita não fica gravada', () => {
    const db = novoBanco()
    const servico = new TransacoesService(db, new PagamentosQueFalham(db))
    expect(() =>
      servico.criar({
        tipo: 'receita',
        categoria: 'venda',
        descricao: 'Conserto avulso',
        valor: 10000,
        data: '2026-10-01',
      }),
    ).toThrow('falha ao gravar as parcelas')
    expect(db.select().from(schema.transacoes).all()).toEqual([])
  })
})
