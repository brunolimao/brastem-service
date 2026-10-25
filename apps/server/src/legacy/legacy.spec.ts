import { verify } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { abrirSqlite, criarDb, migrarSchema } from '../common/database/connection.js'
import { schema } from '../common/database/index.js'
import {
  dataParaIso,
  dinheiroParaCentavos,
  recomendacaoLegado,
  statusLegado,
  tipoPagamentoLegado,
} from './converters.js'
import { decodificarDump, lerDump } from './dump-parser.js'
import { migrarDoDump } from './migrar.js'

const dumpExemplo = `
CREATE TABLE \`Clientes\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`nome\` varchar(255) DEFAULT NULL,
  \`recomendacao\` varchar(255) DEFAULT NULL,
  \`negativado\` varchar(255) DEFAULT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Clientes\` VALUES (1,'João D\\'Ávila','internet','nao','2024-02-14 10:30:00','2024-02-14 10:30:00'),(2,'Maria; (teste)','xyz','sim','2024-03-01 09:00:00','2024-03-01 09:00:00'),(3,NULL,NULL,NULL,'2024-03-02 09:00:00','2024-03-02 09:00:00');
CREATE TABLE \`Telefones\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`telefone\` varchar(255) DEFAULT NULL,
  \`nome\` varchar(255) DEFAULT NULL,
  \`ClienteId\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Telefones\` VALUES (1,'(31) 99999-1111','Casa',1),(2,'(31) 3333-4444','',NULL);
CREATE TABLE \`Aparelhos\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`contagem\` varchar(255) DEFAULT NULL,
  \`nome\` varchar(255) DEFAULT NULL,
  \`garantia\` varchar(255) DEFAULT NULL,
  \`ClienteId\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Aparelhos\` VALUES (10,'1','Geladeira','31/12/2026',1),(11,'1','Fogão','',2);
CREATE TABLE \`OrdemServicos\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`valor\` varchar(255) DEFAULT NULL,
  \`status\` varchar(255) DEFAULT NULL,
  \`servico\` varchar(255) DEFAULT NULL,
  \`garantia\` varchar(255) DEFAULT NULL,
  \`abertura\` varchar(255) DEFAULT NULL,
  \`fechamento\` varchar(255) DEFAULT NULL,
  \`isGarantia\` varchar(255) DEFAULT NULL,
  \`ClienteId\` int DEFAULT NULL,
  \`AparelhoId\` int DEFAULT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`OrdemServicos\` VALUES (100,'300.00','FECHADO','50','90','2024-02-14 00:00:00','2024-02-15 00:00:00','nao',1,10,'2024-02-14 10:30:00','2024-02-14 10:30:00'),(101,'10','ABERTO','0','','Invalid date','','nao',NULL,NULL,'2024-02-14 10:30:00','2024-02-14 10:30:00');
CREATE TABLE \`Pagamentos\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`tipo\` varchar(255) DEFAULT NULL,
  \`parcela\` varchar(255) DEFAULT NULL,
  \`dataParcela\` varchar(255) DEFAULT NULL,
  \`valorPagamento\` varchar(255) DEFAULT NULL,
  \`observacaoPagamento\` varchar(255) DEFAULT NULL,
  \`OrdemServicoId\` int DEFAULT NULL,
  \`TransacaoId\` int DEFAULT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Pagamentos\` VALUES (1,'credito','3','2024-02-15 00:00:00','350','',100,NULL,'2024-02-15 10:00:00','2024-02-15 10:00:00'),(2,'pix','0','2024-02-15 00:00:00','10','',100,NULL,'2024-02-15 10:00:00','2024-02-15 10:00:00'),(3,'pix','0','2024-02-15 00:00:00','10','',NULL,NULL,'2024-02-15 10:00:00','2024-02-15 10:00:00');
CREATE TABLE \`Parcelas\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`tipo\` varchar(255) DEFAULT NULL,
  \`parcela\` varchar(255) DEFAULT NULL,
  \`dataParcela\` varchar(255) DEFAULT NULL,
  \`valorPagamento\` varchar(255) DEFAULT NULL,
  \`PagamentoId\` int DEFAULT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Parcelas\` VALUES (1,'credito','1','2024-03-15 00:00:00','116.66666666666667',1,'2024-02-15 10:00:00','2024-02-15 10:00:00'),(2,'credito','2','2024-04-15 00:00:00','116.66666666666667',1,'2024-02-15 10:00:00','2024-02-15 10:00:00'),(3,'credito','3','2024-05-15 00:00:00','116.66666666666667',1,'2024-02-15 10:00:00','2024-02-15 10:00:00');
CREATE TABLE \`Usuarios\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`usuario\` varchar(255) NOT NULL,
  \`senha\` varchar(255) NOT NULL,
  \`role\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`Usuarios\` VALUES (1,'admin','123456','admin'),(2,'maria','segredo','usuario');
`

describe('conversores', () => {
  it('converte dinheiro em centavos', () => {
    expect(dinheiroParaCentavos('300.00')).toBe(30000)
    expect(dinheiroParaCentavos('116.66666666666667')).toBe(11667)
    expect(dinheiroParaCentavos('1.250,75')).toBe(125075)
    expect(dinheiroParaCentavos('')).toBe(0)
    expect(dinheiroParaCentavos('abc')).toBe(0)
  })

  it('converte datas dos dois formatos antigos e rejeita lixo', () => {
    expect(dataParaIso('2024-02-14 00:00:00')).toBe('2024-02-14')
    expect(dataParaIso('31/12/2026')).toBe('2026-12-31')
    expect(dataParaIso('Invalid date')).toBeNull()
    expect(dataParaIso('')).toBeNull()
  })

  it('aplica os mesmos baldes do relatório antigo para valores desconhecidos', () => {
    expect(recomendacaoLegado('xyz')).toBe('porta')
    expect(statusLegado('qualquer').valor).toBe('APROVADO')
    expect(tipoPagamentoLegado('Pix ').valor).toBe('pix')
    expect(tipoPagamentoLegado('vale').valor).toBe('cheque')
  })
})

describe('leitura do dump', () => {
  it('trata aspas escapadas, ponto e vírgula dentro de texto, NULL e números', () => {
    const dump = lerDump(dumpExemplo)
    expect(dump.Clientes).toHaveLength(3)
    expect(dump.Clientes?.[0]?.nome).toBe("João D'Ávila")
    expect(dump.Clientes?.[1]?.nome).toBe('Maria; (teste)')
    expect(dump.Clientes?.[2]?.nome).toBeNull()
    expect(dump.Clientes?.[0]?.id).toBe(1)
  })
})

describe('codificação do arquivo', () => {
  it('lê dumps em UTF-16 (PowerShell) e UTF-8 com BOM', () => {
    const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(dumpExemplo, 'utf16le')])
    const utf8 = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(dumpExemplo, 'utf8')])
    expect(lerDump(decodificarDump(utf16)).Clientes).toHaveLength(3)
    expect(lerDump(decodificarDump(utf8)).Clientes).toHaveLength(3)
  })
})

describe('migração', () => {
  const novoBanco = () => {
    const sqlite = abrirSqlite(':memory:')
    const db = criarDb(sqlite)
    migrarSchema(db)
    return db
  }

  it('importa mantendo ids, converte tipos e ignora órfãos', async () => {
    const db = novoBanco()
    const relatorio = await migrarDoDump(db, lerDump(dumpExemplo))

    expect(relatorio.tabelas.clientes).toMatchObject({ lidos: 3, importados: 3 })
    expect(relatorio.tabelas.telefones).toMatchObject({ lidos: 2, importados: 1, ignorados: 1 })
    expect(relatorio.tabelas.aparelhos).toMatchObject({ lidos: 2, importados: 2 })
    expect(relatorio.tabelas.ordens_servico).toMatchObject({
      lidos: 2,
      importados: 1,
      ignorados: 1,
    })
    expect(relatorio.tabelas.pagamentos).toMatchObject({ lidos: 3, importados: 2, ignorados: 1 })

    const cliente = db.select().from(schema.clientes).where(eq(schema.clientes.id, 2)).get()
    expect(cliente).toMatchObject({ negativado: true, recomendacao: 'porta' })
    expect(db.select().from(schema.clientes).where(eq(schema.clientes.id, 3)).get()?.nome).toBe(
      '(sem nome)',
    )

    const aparelho = db.select().from(schema.aparelhos).where(eq(schema.aparelhos.id, 10)).get()
    expect(aparelho?.garantiaAte).toBe('2026-12-31')

    const os = db.select().from(schema.ordensServico).get()
    expect(os).toMatchObject({
      id: 100,
      valor: 30000,
      taxaDeslocamento: 5000,
      garantiaDias: 90,
      abertura: '2024-02-14',
      fechamento: '2024-02-15',
      isGarantia: false,
    })
  })

  it('acerta os centavos das parcelas para fechar com o valor do pagamento', async () => {
    const db = novoBanco()
    const relatorio = await migrarDoDump(db, lerDump(dumpExemplo))

    const doCredito = db
      .select()
      .from(schema.parcelas)
      .where(eq(schema.parcelas.pagamentoId, 1))
      .all()
    expect(doCredito.map((p) => p.valor)).toEqual([11667, 11667, 11666])
    expect(doCredito.reduce((soma, p) => soma + p.valor, 0)).toBe(35000)
    expect(doCredito.map((p) => p.data)).toEqual(['2024-03-15', '2024-04-15', '2024-05-15'])

    // Pagamento sem parcelas no sistema antigo é regerado à vista.
    const doPix = db.select().from(schema.parcelas).where(eq(schema.parcelas.pagamentoId, 2)).all()
    expect(doPix).toMatchObject([{ numero: 0, valor: 1000, data: '2024-02-15' }])

    expect(relatorio.totais).toEqual({ ordensServico: 35000, pagamentos: 36000, parcelas: 36000 })
  })

  it('faz hash das senhas antigas, que continuam valendo no login', async () => {
    const db = novoBanco()
    await migrarDoDump(db, lerDump(dumpExemplo))

    const admin = db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.usuario, 'admin'))
      .get()
    expect(admin?.role).toBe('admin')
    expect(admin?.senhaHash).not.toContain('123456')
    expect(await verify(admin?.senhaHash ?? '', '123456')).toBe(true)
  })

  it('recusa rodar em banco que já tem clientes', async () => {
    const db = novoBanco()
    await migrarDoDump(db, lerDump(dumpExemplo))
    await expect(migrarDoDump(db, lerDump(dumpExemplo))).rejects.toThrow('já tem clientes')
  })
})
