# Importação do sistema antigo

> Trazer os dados do sistema antigo (MySQL) para o novo, uma única vez, no primeiro uso.

**Prefixo das regras:** `R-IMPT`

## Objetivo

Começar a usar o sistema novo com todo o histórico: clientes, telefones, aparelhos, OS, pagamentos, parcelas,
receitas/despesas e usuários (com as mesmas senhas).

## Quem usa

Quem instala o sistema, uma vez, antes de criar qualquer usuário.

## Telas

- _**Importar dados**_ (link na tela de primeiro acesso): envia o arquivo `.sql` e mostra o relatório
  (quantos registros importados e ignorados por tabela, totais em dinheiro e avisos).

## Entrada

Um dump do MySQL do sistema antigo feito com o `mysqldump` (o do Railway), com as tabelas `Clientes`,
`Telefones`, `Aparelhos`, `OrdemServicos`, `Pagamentos`, `Parcelas`, `Transacaos` e `Usuarios`. Aceita
arquivo em UTF-8 (com ou sem BOM) e UTF-16 (gerado pelo PowerShell). Limite: 200 MB.

## Regras

- **R-IMPT-01**: só funciona com o banco **sem usuários**; depois disso é recusada sem nem receber o arquivo.
- **R-IMPT-02**: os códigos (ids) dos registros são mantidos, então números de OS e de clientes continuam os mesmos.
- **R-IMPT-03**: conversões: datas `dd/mm/aaaa` ou `aaaa-mm-dd` viram data; valores viram centavos (no
  formato antigo, o ponto é decimal: "116.66666666666667"); datas e horas, gravadas no horário de Brasília
  pelo sistema antigo, viram UTC; garantia "90", "90 DIAS", "365 DIIAS" viram o número de dias.
- **R-IMPT-04**: valores fora do padrão viram um valor válido e entram nos avisos: status desconhecido → Aprovado;
  "como conheceu" desconhecido → Porta; forma de pagamento desconhecida → Cheque.
- **R-IMPT-05**: registros órfãos (pagamento de OS ou cliente que não existe mais, OS sem aparelho válido) são
  ignorados e listados nos avisos; por isso totais antigos do caixa podem diferir um pouco.
- **R-IMPT-06**: senhas antigas (em texto) são convertidas para argon2: cada usuário continua entrando com a
  mesma senha.
- **R-IMPT-07**: a garantia de cada aparelho é recalculada pela regra nova (R-GAR-02), com a garantia antiga
  como piso (R-GAR-03). O sistema antigo não somava garantias escritas como texto ("90 DIAS"), gravando a data
  de fechamento (garantia zero); a importação corrige e informa quantos aparelhos mudaram. No dump do
  Railway foram 1.711 de 1.733 aparelhos com garantia.
- **R-IMPT-08**: tudo é importado numa transação: se algo falhar, nada fica pela metade.
- **R-IMPT-09**: acentos quebrados pelo PowerShell (`mysqldump ... > arquivo.sql` grava "S├âO" no lugar de "SÃO")
  são consertados na leitura, e o relatório avisa quantos trechos mudaram. Só age em arquivos com essa
  assinatura (`├`/`┬` seguidos de um caractere de continuação); um `.sql` normal fica intacto. O dump do
  Railway importado em 26/10/2026 tinha 7.875 campos assim (2.608 clientes, 2.621 OS).

## Permissões

Pública, mas só enquanto não existe nenhum usuário (R-IMPT-01).

## API

| Método e rota                                                | Para quê                             | Quem pode                |
| ------------------------------------------------------------ | ------------------------------------ | ------------------------ |
| `POST /api/import/legacy` (corpo `application/octet-stream`) | importa o dump e devolve o relatório | público, só sem usuários |

Também existe o script `pnpm --filter @brastem/server migrate:legacy -- <dump.sql>` para importar fora do app.

## Onde está no código

- Server: `apps/server/src/legacy/` (`dump-parser.ts`, `converters.ts`, `migrar.ts`), `modules/importacao/`
- Client: `routes/importar.tsx`, `services/importacao.service.ts`

## Testes

- `apps/server/src/legacy/legacy.spec.ts` — leitura do dump, conversões, órfãos, garantia (R-IMPT-02 a R-IMPT-07).
- `apps/server/test/importacao.e2e-spec.ts` — importação pela API, senhas antigas valendo, recusa com usuários (R-IMPT-01, R-IMPT-06).
- `apps/server/src/legacy/acentos.spec.ts` e `apps/server/test/importacao.e2e-spec.ts` (dump do PowerShell) — R-IMPT-09.

## Limitações conhecidas

- Os arquivos `backup_*.sql` gerados pelo próprio sistema antigo (2024, formato diferente e só 4 tabelas) não
  são lidos; use o dump do Railway.
