import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  abrirSqlite,
  aplicarRestauracaoPendente,
  criarDb,
  type Db,
  MENSAGEM_BANCO_MAIS_NOVO,
  migrarSchema,
  NOME_RESTAURACAO_PENDENTE,
  situacaoDoSchema,
} from './connection.js'

const MIGRACOES = fileURLToPath(new URL('./migrations', import.meta.url))

/**
 * Cópia das migrações do app com uma a mais que recria a tabela clientes, como o drizzle-kit faz ao
 * mudar uma coluna (inclusive o `PRAGMA foreign_keys=OFF`, que não vale dentro da transação).
 */
function criarPastaComMigracaoQueRecriaClientes(base: string, sqlite: Database.Database) {
  const pasta = join(base, 'migracoes')
  cpSync(MIGRACOES, pasta, { recursive: true })
  const { sql: ddl } = sqlite
    .prepare("select sql from sqlite_master where type = 'table' and name = 'clientes'")
    .get() as { sql: string }
  const nova = ddl.replace(/^CREATE TABLE [`"]?clientes[`"]?/i, 'CREATE TABLE `__new_clientes`')
  writeFileSync(
    join(pasta, '9999_recria_clientes.sql'),
    [
      'PRAGMA foreign_keys=OFF;',
      `${nova};`,
      'INSERT INTO `__new_clientes` SELECT * FROM `clientes`;',
      'DROP TABLE `clientes`;',
      'ALTER TABLE `__new_clientes` RENAME TO `clientes`;',
      'PRAGMA foreign_keys=ON;',
    ].join('\n--> statement-breakpoint\n'),
  )
  const journal = JSON.parse(readFileSync(join(pasta, 'meta', '_journal.json'), 'utf8'))
  journal.entries.push({
    idx: journal.entries.length,
    version: '6',
    when: Date.now() + 1000,
    tag: '9999_recria_clientes',
    breakpoints: true,
  })
  writeFileSync(join(pasta, 'meta', '_journal.json'), JSON.stringify(journal))
  return pasta
}

/** Cópia das migrações do app sem a última, como as de uma versão anterior. */
function criarPastaSemAUltimaMigracao(base: string) {
  const pasta = join(base, 'migracoes-anteriores')
  cpSync(MIGRACOES, pasta, { recursive: true })
  const journal = JSON.parse(readFileSync(join(pasta, 'meta', '_journal.json'), 'utf8'))
  journal.entries.pop()
  writeFileSync(join(pasta, 'meta', '_journal.json'), JSON.stringify(journal))
  return pasta
}

const migrarSchemaDe = (db: Db, pasta: string) => migrarSchema(db, new Date(), pasta)

const criarBanco = (caminho: string, valor: string) => {
  const banco = new Database(caminho)
  banco.exec('create table t (v text)')
  banco.prepare('insert into t values (?)').run(valor)
  banco.close()
}

const ler = (caminho: string) => {
  const banco = new Database(caminho, { readonly: true })
  const { v } = banco.prepare('select v from t').get() as { v: string }
  banco.close()
  return v
}

describe('aplicarRestauracaoPendente', () => {
  let pasta: string
  let banco: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-restauracao-'))
    banco = join(pasta, 'brastem.sqlite')
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  it('não faz nada sem restauração pendente', () => {
    criarBanco(banco, 'atual')
    expect(aplicarRestauracaoPendente(banco)).toBe(false)
    expect(ler(banco)).toBe('atual')
  })

  it('troca o banco pelo pendente e guarda o antigo em backups/antes-da-restauracao-* (R-BKP-07)', () => {
    criarBanco(banco, 'atual')
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')

    expect(aplicarRestauracaoPendente(banco, new Date(2026, 9, 25, 14, 30, 5))).toBe(true)

    expect(ler(banco)).toBe('restaurado')
    expect(existsSync(join(pasta, NOME_RESTAURACAO_PENDENTE))).toBe(false)
    const guardado = join(pasta, 'backups', 'antes-da-restauracao-2026-10-25-143005.sqlite')
    expect(ler(guardado)).toBe('atual')
  })

  it('guarda o banco antigo completo num arquivo só, com o que estava só no -wal (fechamento abrupto) (R-BKP-07)', () => {
    // Estado de um app fechado à força: a última alteração ainda está só no -wal.
    const origem = join(pasta, 'origem.sqlite')
    criarBanco(origem, 'antigo')
    const aberto = new Database(origem)
    aberto.pragma('journal_mode = WAL')
    aberto.pragma('wal_autocheckpoint = 0')
    aberto.prepare('update t set v = ?').run('alteração recente')
    writeFileSync(banco, readFileSync(origem))
    writeFileSync(`${banco}-wal`, readFileSync(`${origem}-wal`))
    aberto.close()
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')

    aplicarRestauracaoPendente(banco, new Date(2026, 9, 25, 14, 30, 5))

    expect(ler(banco)).toBe('restaurado')
    expect(existsSync(`${banco}-wal`)).toBe(false)
    // Restaurar a cópia depois (pela lista ou por arquivo) lê só o .sqlite: ela precisa estar completa.
    const guardado = join(pasta, 'backups', 'antes-da-restauracao-2026-10-25-143005.sqlite')
    const soOArquivo = join(pasta, 'so-o-arquivo.sqlite')
    writeFileSync(soOArquivo, readFileSync(guardado))
    expect(ler(soOArquivo)).toBe('alteração recente')
    expect(readdirSync(join(pasta, 'backups'))).toEqual([
      'antes-da-restauracao-2026-10-25-143005.sqlite',
    ])
  })

  it('um -wal corrompido não impede a troca (o banco antigo fica como estava)', () => {
    criarBanco(banco, 'atual')
    writeFileSync(`${banco}-wal`, 'lixo que não é um wal')
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')

    expect(aplicarRestauracaoPendente(banco, new Date(2026, 9, 25, 14, 30, 5))).toBe(true)

    expect(ler(banco)).toBe('restaurado')
    expect(existsSync(`${banco}-wal`)).toBe(false)
    expect(ler(join(pasta, 'backups', 'antes-da-restauracao-2026-10-25-143005.sqlite'))).toBe(
      'atual',
    )
  })

  it('instala o pendente mesmo quando ainda não existe banco', () => {
    criarBanco(join(pasta, NOME_RESTAURACAO_PENDENTE), 'restaurado')
    expect(aplicarRestauracaoPendente(banco)).toBe(true)
    expect(ler(banco)).toBe('restaurado')
  })

  it('ignora o banco em memória', () => {
    expect(aplicarRestauracaoPendente(':memory:')).toBe(false)
  })
})

describe('migrarSchema', () => {
  let pasta: string
  let arquivo: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'brastem-migracao-'))
    arquivo = join(pasta, 'brastem.sqlite')
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  const abrir = () => {
    const sqlite = abrirSqlite(arquivo)
    return { sqlite, db: criarDb(sqlite) }
  }

  it('banco novo: migra sem criar cópia (não há o que guardar)', () => {
    const { sqlite, db } = abrir()
    migrarSchema(db)
    expect(situacaoDoSchema(sqlite)).toMatchObject({ existente: true, pendentes: 0 })
    expect(existsSync(join(pasta, 'backups'))).toBe(false)
    sqlite.close()
  })

  it('cria índices nas colunas de vínculo e de data (R-DAD-10)', () => {
    const { sqlite, db } = abrir()
    migrarSchema(db)
    const indexadas = (tabela: string) =>
      (
        sqlite.prepare(`select name from pragma_index_list('${tabela}')`).all() as {
          name: string
        }[]
      ).flatMap(({ name }) =>
        (
          sqlite.prepare(`select name from pragma_index_info('${name}')`).all() as {
            name: string
          }[]
        ).map((coluna) => `${tabela}.${coluna.name}`),
      )
    const colunas = [
      'telefones',
      'aparelhos',
      'ordens_servico',
      'pagamentos',
      'parcelas',
      'transacoes',
      'refresh_tokens',
    ].flatMap(indexadas)
    expect(colunas).toEqual(
      expect.arrayContaining([
        'telefones.cliente_id',
        'aparelhos.cliente_id',
        'ordens_servico.cliente_id',
        'ordens_servico.aparelho_id',
        'ordens_servico.abertura',
        'pagamentos.ordem_servico_id',
        'pagamentos.transacao_id',
        'pagamentos.data',
        'parcelas.pagamento_id',
        'parcelas.data',
        'transacoes.data',
        'refresh_tokens.usuario_id',
      ]),
    )
    sqlite.close()
  })

  it('banco existente com migração pendente: guarda uma cópia antes de migrar (R-DAD-08, R-ATU-09)', () => {
    const { sqlite, db } = abrir()
    // Banco da versão anterior: todas as migrações menos a última.
    migrarSchema(db, new Date(), criarPastaSemAUltimaMigracao(pasta))
    sqlite
      .prepare(
        "insert into clientes (nome, recomendacao, criado_em) values ('Maria', 'porta', '2026-01-01T00:00:00Z')",
      )
      .run()
    expect(situacaoDoSchema(sqlite).pendentes).toBe(1)

    migrarSchema(db, new Date(2026, 9, 26, 9, 0, 0))

    const copia = join(pasta, 'backups', 'antes-da-migracao-2026-10-26-090000.sqlite')
    const antigo = new Database(copia, { readonly: true })
    expect(antigo.prepare('select nome from clientes').get()).toEqual({ nome: 'Maria' })
    antigo.close()
    expect(situacaoDoSchema(sqlite).pendentes).toBe(0)
    sqlite.close()
  })

  it('não apaga dados em cascata quando uma migração recria uma tabela (R-DAD-08)', () => {
    const { sqlite, db } = abrir()
    migrarSchema(db)
    sqlite
      .prepare(
        "insert into clientes (id, nome, recomendacao, criado_em) values (1, 'Maria', 'porta', '2026-01-01T00:00:00Z')",
      )
      .run()
    sqlite
      .prepare("insert into aparelhos (cliente_id, nome, ordem) values (1, 'Geladeira', 1)")
      .run()

    // O mesmo que o drizzle-kit gera para mudar uma coluna: recria a tabela clientes.
    const pastaMigracoes = criarPastaComMigracaoQueRecriaClientes(pasta, sqlite)
    migrarSchemaDe(db, pastaMigracoes)

    expect(sqlite.prepare('select count(*) as n from aparelhos').get()).toEqual({ n: 1 })
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1)
    sqlite.close()
  })

  it('0004: em banco existente, a garantia atual vira piso e é recalculada pelas OS', () => {
    const { sqlite, db } = abrir()
    migrarSchema(db, new Date(), criarPastaSemAUltimaMigracao(pasta))
    sqlite.exec(`
      insert into clientes (id, nome, recomendacao, criado_em) values (1, 'Maria', 'porta', '2024-01-01T00:00:00Z');
      -- Como o sistema antigo gravou: "90 DIAS" somou 0 dias, garantia = fechamento.
      insert into aparelhos (id, cliente_id, nome, ordem, garantia_ate) values (1, 1, 'Geladeira', 1, '2024-02-15');
      -- Garantia que não tem OS que a explique.
      insert into aparelhos (id, cliente_id, nome, ordem, garantia_ate) values (2, 1, 'Fogão', 2, '2026-12-31');
      insert into aparelhos (id, cliente_id, nome, ordem) values (3, 1, 'Micro-ondas', 3);
      insert into ordens_servico (cliente_id, aparelho_id, status, abertura, fechamento, garantia_dias, criado_em)
        values (1, 1, 'FECHADO', '2024-02-15', '2024-02-15', 90, '2024-02-15T12:00:00Z'),
               (1, 2, 'FECHADO', '2024-02-15', '2024-02-15', 30, '2024-02-15T12:00:00Z');
    `)

    migrarSchema(db)

    expect(
      sqlite
        .prepare(
          'select id, garantia_ate as ate, garantia_importada as piso from aparelhos order by id',
        )
        .all(),
    ).toEqual([
      { id: 1, ate: '2024-05-15', piso: '2024-02-15' },
      { id: 2, ate: '2026-12-31', piso: '2026-12-31' },
      { id: 3, ate: null, piso: null },
    ])
    sqlite.close()
  })

  it('recusa um banco gravado por uma versão mais nova do app (R-DAD-08)', () => {
    const { sqlite, db } = abrir()
    migrarSchema(db)
    sqlite.prepare('update __drizzle_migrations set created_at = created_at + 1000000000').run()
    expect(() => migrarSchema(db)).toThrow(MENSAGEM_BANCO_MAIS_NOVO)
    sqlite.close()
  })
})
