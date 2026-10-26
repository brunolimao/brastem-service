import { RECOMENDACOES } from '@brastem/shared'
import { hash } from '@node-rs/argon2'
import { count, eq } from 'drizzle-orm'
import { type Db, schema } from '../common/database/index.js'
import { somarMeses } from '../common/utils/dates.js'
import { dividirEmParcelas } from '../common/utils/money.js'
import { recalcularGarantia } from '../modules/ordens-servico/garantia.js'
import {
  dataHoraParaIso,
  dataParaIso,
  dinheiroParaCentavos,
  inteiro,
  recomendacaoLegado,
  simOuNao,
  statusLegado,
  texto,
  tipoPagamentoLegado,
} from './converters.js'
import type { DumpLegado, LinhaLegada } from './dump-parser.js'

const {
  clientes,
  telefones,
  aparelhos,
  ordensServico,
  pagamentos,
  parcelas,
  transacoes,
  usuarios,
} = schema

export interface ResumoTabela {
  lidos: number
  importados: number
  ignorados: number
}

export interface RelatorioMigracao {
  tabelas: Record<string, ResumoTabela>
  /** Totais em centavos, para conferir contra o sistema antigo. */
  totais: {
    ordensServico: number
    pagamentos: number
    parcelas: number
  }
  avisos: string[]
}

const MAX_AVISOS = 200

/**
 * Importa o dump do sistema antigo para o banco novo, mantendo os mesmos ids.
 * Linhas órfãs (sem cliente, aparelho ou pagamento) são ignoradas e listadas nos avisos.
 * Recusa rodar se o banco novo já tiver clientes.
 */
export async function migrarDoDump(db: Db, dump: DumpLegado): Promise<RelatorioMigracao> {
  const existentes = db.select({ total: count() }).from(clientes).get()?.total ?? 0
  if (existentes > 0) {
    throw new Error('O banco de destino já tem clientes. Use um banco novo para a migração.')
  }

  const relatorio: RelatorioMigracao = {
    tabelas: {},
    totais: { ordensServico: 0, pagamentos: 0, parcelas: 0 },
    avisos: [],
  }
  const aviso = (mensagem: string) => {
    if (relatorio.avisos.length < MAX_AVISOS) relatorio.avisos.push(mensagem)
  }
  const resumo = (tabela: string, lidos: number): ResumoTabela => {
    const item = { lidos, importados: 0, ignorados: 0 }
    relatorio.tabelas[tabela] = item
    return item
  }

  // Hash das senhas antes da transação: argon2 é assíncrono e a transação do SQLite é síncrona.
  const usuariosLegado = new Map<string, LinhaLegada>()
  for (const tabela of ['usuarios', 'Usuarios']) {
    for (const linha of dump[tabela] ?? []) {
      const nome = texto(linha.usuario)
      if (nome && !usuariosLegado.has(nome)) usuariosLegado.set(nome, linha)
    }
  }
  const usuariosComHash = await Promise.all(
    [...usuariosLegado.values()].map(async (linha) => ({
      usuario: texto(linha.usuario),
      senhaHash: await hash(texto(linha.senha) || crypto.randomUUID()),
      role: texto(linha.role) === 'admin' ? ('admin' as const) : ('usuario' as const),
      semSenha: texto(linha.senha) === '',
    })),
  )

  db.transaction((tx) => {
    // Usuários
    const resUsuarios = resumo(
      'usuarios',
      (dump.Usuarios?.length ?? 0) + (dump.usuarios?.length ?? 0),
    )
    for (const u of usuariosComHash) {
      if (u.semSenha)
        aviso(`Usuário "${u.usuario}" estava sem senha: foi gerada uma aleatória, redefina-a.`)
      tx.insert(usuarios).values({ usuario: u.usuario, senhaHash: u.senhaHash, role: u.role }).run()
      resUsuarios.importados += 1
    }
    resUsuarios.ignorados = resUsuarios.lidos - resUsuarios.importados

    // Clientes
    const listaClientes = dump.Clientes ?? []
    const resClientes = resumo('clientes', listaClientes.length)
    const idsClientes = new Set<number>()
    const recomendacoesDesconhecidas = new Set<string>()
    for (const c of listaClientes) {
      const id = inteiro(c.id)
      if (id === null) {
        resClientes.ignorados += 1
        continue
      }
      if (!(RECOMENDACOES as readonly string[]).includes(texto(c.recomendacao).toLowerCase())) {
        recomendacoesDesconhecidas.add(texto(c.recomendacao) || '(vazio)')
      }
      tx.insert(clientes)
        .values({
          id,
          nome: texto(c.nome) || '(sem nome)',
          cpf: texto(c.cpf),
          email: texto(c.email),
          endereco: texto(c.endereco),
          numero: texto(c.numero),
          complemento: texto(c.complemento),
          bairro: texto(c.bairro),
          cep: texto(c.cep),
          uf: texto(c.uf),
          cidade: texto(c.cidade),
          negativado: simOuNao(c.negativado),
          motivo: texto(c.motivo),
          recomendacao: recomendacaoLegado(c.recomendacao),
          referencia: texto(c.referencia),
          criadoEm: dataHoraParaIso(c.createdAt),
        })
        .run()
      idsClientes.add(id)
      resClientes.importados += 1
    }
    if (recomendacoesDesconhecidas.size > 0) {
      aviso(
        `Recomendações fora do padrão viraram "porta": ${[...recomendacoesDesconhecidas].join(', ')}`,
      )
    }

    // Telefones
    const listaTelefones = dump.Telefones ?? []
    const resTelefones = resumo('telefones', listaTelefones.length)
    for (const t of listaTelefones) {
      const clienteId = inteiro(t.ClienteId)
      if (clienteId === null || !idsClientes.has(clienteId) || !texto(t.telefone)) {
        resTelefones.ignorados += 1
        continue
      }
      tx.insert(telefones)
        .values({
          id: inteiro(t.id) ?? undefined,
          clienteId,
          nome: texto(t.nome),
          telefone: texto(t.telefone),
        })
        .run()
      resTelefones.importados += 1
    }

    // Aparelhos
    const listaAparelhos = dump.Aparelhos ?? []
    const resAparelhos = resumo('aparelhos', listaAparelhos.length)
    const aparelhoDoCliente = new Map<number, number>()
    for (const [indice, a] of listaAparelhos.entries()) {
      const id = inteiro(a.id)
      const clienteId = inteiro(a.ClienteId)
      if (id === null || clienteId === null || !idsClientes.has(clienteId)) {
        resAparelhos.ignorados += 1
        continue
      }
      tx.insert(aparelhos)
        .values({
          id,
          clienteId,
          ordem: inteiro(a.contagem) ?? indice + 1,
          nome: texto(a.nome) || '(sem nome)',
          marca: texto(a.marca),
          modelo: texto(a.modelo),
          pnc: texto(a.pnc),
          garantiaAte: dataParaIso(a.garantia),
          garantiaImportada: dataParaIso(a.garantia),
          observacao: texto(a.observacao),
        })
        .run()
      aparelhoDoCliente.set(id, clienteId)
      resAparelhos.importados += 1
    }

    // Ordens de serviço
    const listaOrdens = dump.OrdemServicos ?? []
    const resOrdens = resumo('ordens_servico', listaOrdens.length)
    const idsOrdens = new Set<number>()
    const abertura = new Map<number, string>()
    let statusDesconhecidos = 0
    for (const o of listaOrdens) {
      const id = inteiro(o.id)
      const clienteId = inteiro(o.ClienteId)
      const aparelhoId = inteiro(o.AparelhoId)
      if (
        id === null ||
        clienteId === null ||
        aparelhoId === null ||
        !idsClientes.has(clienteId) ||
        aparelhoDoCliente.get(aparelhoId) === undefined
      ) {
        resOrdens.ignorados += 1
        aviso(`OS ${texto(o.id)} ignorada: sem cliente ou aparelho válido.`)
        continue
      }

      const status = statusLegado(o.status)
      if (!status.reconhecido) statusDesconhecidos += 1
      const dataAbertura = dataParaIso(o.abertura) ?? dataHoraParaIso(o.createdAt).slice(0, 10)
      if (!dataParaIso(o.abertura)) aviso(`OS ${id}: abertura inválida, usada a data de criação.`)

      const valor = dinheiroParaCentavos(o.valor)
      const taxa = dinheiroParaCentavos(o.servico)
      tx.insert(ordensServico)
        .values({
          id,
          clienteId,
          aparelhoId,
          status: status.valor,
          valor,
          taxaDeslocamento: taxa,
          relatado: texto(o.relatado),
          identificado: texto(o.identificado),
          solucionado: texto(o.solucionado),
          observacao: texto(o.observacao),
          garantiaDias: inteiro(o.garantia),
          isGarantia: simOuNao(o.isGarantia),
          abertura: dataAbertura,
          fechamento: dataParaIso(o.fechamento),
          criadoEm: dataHoraParaIso(o.createdAt),
        })
        .run()
      idsOrdens.add(id)
      abertura.set(id, dataAbertura)
      relatorio.totais.ordensServico += valor + taxa
      resOrdens.importados += 1
    }
    if (statusDesconhecidos > 0)
      aviso(`${statusDesconhecidos} OS com status fora do padrão viraram APROVADO.`)

    // Garantia de cada aparelho pela regra do sistema novo (a maior entre as OS e a antiga). O sistema
    // antigo não somava garantias escritas como texto ("90 DIAS"): gravava a data de fechamento, ou seja,
    // garantia zero. Aqui elas passam a valer o que foi combinado com o cliente.
    let garantiasCorrigidas = 0
    for (const [id] of aparelhoDoCliente) {
      const antes = tx
        .select({ garantiaAte: aparelhos.garantiaAte })
        .from(aparelhos)
        .where(eq(aparelhos.id, id))
        .get()?.garantiaAte
      if (recalcularGarantia(tx, id) !== (antes ?? null)) garantiasCorrigidas += 1
    }
    if (garantiasCorrigidas > 0)
      aviso(
        `${garantiasCorrigidas} aparelho(s) com a garantia recalculada pelas OS (no sistema antigo, garantias escritas como "90 DIAS" não eram somadas à data de fechamento).`,
      )

    // Transações (receitas/despesas avulsas)
    const listaTransacoes = dump.Transacaos ?? []
    const resTransacoes = resumo('transacoes', listaTransacoes.length)
    const idsTransacoes = new Set<number>()
    for (const t of listaTransacoes) {
      const id = inteiro(t.id)
      const tipo = texto(t.tipo) === 'despesa' ? 'despesa' : 'receita'
      const data = dataParaIso(t.data)
      if (id === null || !data) {
        resTransacoes.ignorados += 1
        continue
      }
      tx.insert(transacoes)
        .values({
          id,
          tipo,
          categoria: texto(t.categoria) || 'outros',
          data,
          descricao: texto(t.descricao) || '(sem descrição)',
          observacao: texto(t.observacao),
          valor: Math.abs(dinheiroParaCentavos(t.valor)),
          criadoEm: dataHoraParaIso(t.createdAt),
        })
        .run()
      idsTransacoes.add(id)
      resTransacoes.importados += 1
    }

    // Pagamentos e parcelas: as parcelas antigas valem como histórico; só acertamos os centavos.
    const parcelasLegado = new Map<number, LinhaLegada[]>()
    for (const p of dump.Parcelas ?? []) {
      const pagamentoId = inteiro(p.PagamentoId)
      if (pagamentoId === null) continue
      parcelasLegado.set(pagamentoId, [...(parcelasLegado.get(pagamentoId) ?? []), p])
    }

    const listaPagamentos = dump.Pagamentos ?? []
    const resPagamentos = resumo('pagamentos', listaPagamentos.length)
    const resParcelas = resumo('parcelas', dump.Parcelas?.length ?? 0)
    let tiposDesconhecidos = 0
    let parcelasRegeradas = 0
    let parcelasInconsistentes = 0
    let parcelasLegadoUsadas = 0
    let orfaosQuantidade = 0
    let orfaosValor = 0
    let orfaosParcelasValor = 0

    for (const p of listaPagamentos) {
      const id = inteiro(p.id)
      const ordemServicoId = inteiro(p.OrdemServicoId)
      const transacaoId = inteiro(p.TransacaoId)
      const donoValido =
        (ordemServicoId !== null && idsOrdens.has(ordemServicoId)) ||
        (transacaoId !== null && idsTransacoes.has(transacaoId))
      if (id === null || !donoValido) {
        resPagamentos.ignorados += 1
        orfaosQuantidade += 1
        orfaosValor += dinheiroParaCentavos(p.valorPagamento)
        for (const o of id === null ? [] : (parcelasLegado.get(id) ?? [])) {
          orfaosParcelasValor += dinheiroParaCentavos(o.valorPagamento)
        }
        continue
      }

      const tipo = tipoPagamentoLegado(p.tipo)
      if (!tipo.reconhecido) tiposDesconhecidos += 1
      const valor = dinheiroParaCentavos(p.valorPagamento)
      const quantidade = Math.max(0, inteiro(p.parcela) ?? 0)
      const data =
        dataParaIso(p.dataParcela) ??
        (ordemServicoId !== null ? abertura.get(ordemServicoId) : undefined) ??
        dataHoraParaIso(p.createdAt).slice(0, 10)

      tx.insert(pagamentos)
        .values({
          id,
          ordemServicoId:
            ordemServicoId !== null && idsOrdens.has(ordemServicoId) ? ordemServicoId : null,
          transacaoId: transacaoId !== null && idsTransacoes.has(transacaoId) ? transacaoId : null,
          tipo: tipo.valor,
          parcelas: quantidade,
          data,
          valor,
          observacao: texto(p.observacaoPagamento),
          criadoEm: dataHoraParaIso(p.createdAt),
        })
        .run()
      relatorio.totais.pagamentos += valor
      resPagamentos.importados += 1

      const originais = (parcelasLegado.get(id) ?? []).sort(
        (a, b) => (inteiro(a.parcela) ?? 0) - (inteiro(b.parcela) ?? 0),
      )
      parcelasLegadoUsadas += originais.length
      let linhas: { numero: number; data: string; valor: number }[]

      if (originais.length === 0) {
        parcelasRegeradas += 1
        linhas =
          quantidade === 0
            ? [{ numero: 0, data, valor }]
            : dividirEmParcelas(valor, quantidade).map((parte, indice) => ({
                numero: indice + 1,
                data: somarMeses(data, indice + 1),
                valor: parte,
              }))
      } else {
        linhas = originais.map((o, indice) => ({
          numero: inteiro(o.parcela) ?? indice,
          data: dataParaIso(o.dataParcela) ?? data,
          valor: dinheiroParaCentavos(o.valorPagamento),
        }))
        const diferenca = valor - linhas.reduce((soma, l) => soma + l.valor, 0)
        const ultima = linhas[linhas.length - 1]
        if (diferenca !== 0 && ultima) {
          if (Math.abs(diferenca) <= linhas.length) ultima.valor += diferenca
          else parcelasInconsistentes += 1
        }
        if (diferenca !== 0 && Math.abs(diferenca) > linhas.length) {
          aviso(
            `Pagamento ${id}: parcelas somam ${valor - diferenca} e o pagamento ${valor} (centavos).`,
          )
        }
      }

      for (const linha of linhas) {
        tx.insert(parcelas)
          .values({ pagamentoId: id, ...linha })
          .run()
        relatorio.totais.parcelas += linha.valor
        resParcelas.importados += 1
      }
    }
    resParcelas.ignorados = resParcelas.lidos - parcelasLegadoUsadas

    if (orfaosQuantidade > 0) {
      const reais = (c: number) =>
        (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      aviso(
        `${orfaosQuantidade} pagamentos sem OS (cliente ou OS apagados no sistema antigo) não foram importados: ${reais(orfaosValor)} em pagamentos, ${reais(orfaosParcelasValor)} deles em parcelas que apareciam no caixa antigo.`,
      )
    }
    if (tiposDesconhecidos > 0)
      aviso(`${tiposDesconhecidos} pagamentos com forma fora do padrão viraram "cheque".`)
    if (parcelasRegeradas > 0) {
      aviso(
        `${parcelasRegeradas} pagamentos estavam sem parcelas no sistema antigo e foram regerados.`,
      )
    }
    if (parcelasInconsistentes > 0) {
      aviso(
        `${parcelasInconsistentes} pagamentos têm parcelas que não somam o valor (mantidas como estavam).`,
      )
    }
  })

  return relatorio
}
