/** Dump mínimo no formato do mysqldump do sistema antigo, usado nos testes. */
export const dumpExemplo = `
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
