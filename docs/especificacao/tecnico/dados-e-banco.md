# Dados e banco

> Como os dados são guardados para não haver erro de centavos, de fuso ou perda numa atualização.

**Prefixo das regras:** `R-DAD`

## Onde ficam

| O quê            | Onde (Windows)                                                                          |
| ---------------- | --------------------------------------------------------------------------------------- |
| Banco (SQLite)   | `%APPDATA%\Brastem-Service\dados\brastem.sqlite`                                        |
| Backups locais   | `%APPDATA%\Brastem-Service\dados\backups\`                                              |
| Logs (14 dias)   | `%APPDATA%\Brastem-Service\dados\logs\`                                                 |
| Chave da sessão  | `%APPDATA%\Brastem-Service\dados\segredo.key` (gerada na primeira abertura)             |
| Chaves do Google | `%APPDATA%\Brastem-Service\dados\integracoes\google.json` (fora do banco e dos backups) |

## Regras

- **R-DAD-01**: Dinheiro: guardado e trafegado em **centavos inteiros**; só a tela formata em reais. O que o
  usuário digita é lido pelo conversor único (`packages/shared/src/dinheiro.ts`): vírgula é decimal e ponto é
  milhar ("1.250" = mil duzentos e cinquenta; "1.250,50"); ponto só é decimal com 1 ou 2 casas e sem
  vírgula ("150.50"). Texto inválido é recusado.
- **R-DAD-02**: Datas de negócio (abertura, fechamento, pagamento, parcela, garantia, lançamento): só o dia,
  `aaaa-mm-dd`, sem hora nem fuso. Datas que não existem (30/02) são recusadas.
- **R-DAD-03**: Momentos (`criado_em`): data e hora em UTC. Para contar "em que dia foi", usa-se o horário local
  do computador (R-REL-04).
- **R-DAD-04**: Períodos: "De/Até" incluem as duas pontas.
- **R-DAD-05**: Gravações compostas (OS + pagamentos + parcelas; lançamento + pagamentos; importação) acontecem
  numa única transação: ou grava tudo, ou nada.
- **R-DAD-06**: Exclusões em cascata: excluir um cliente apaga telefones, aparelhos, OS, pagamentos e parcelas;
  excluir um aparelho apaga as OS dele com pagamentos e parcelas; excluir uma OS ou um lançamento apaga os
  pagamentos e parcelas dele; excluir um usuário apaga as sessões dele. A tela avisa antes de cada uma.
- **R-DAD-07**: Campos obrigatórios: enviar `null` num campo obrigatório é recusado com mensagem (erro 400),
  nunca chega ao banco. `null` só é aceito onde significa "limpar" (fechamento e garantia da OS).
- **R-DAD-08**: Migrações (mudança de estrutura trazida por uma versão nova), aplicadas sozinhas ao abrir:
  1. se o banco foi gravado por uma versão **mais nova** do app, ele se recusa a abrir (com mensagem) em vez
     de arriscar os dados;
  2. antes de mudar a estrutura, guarda uma cópia em `backups/antes-da-migracao-*.sqlite` (restaurável pela tela);
  3. aplica as mudanças com as chaves estrangeiras desligadas (recriar uma tabela com elas ligadas apagaria
     em cascata as OS) e confere no fim se nenhum registro ficou sem vínculo.
- **R-DAD-09**: Migração nunca é editada depois de publicada: mudança nova é sempre uma migração nova.
  Mudança em dados existentes vai na própria migração e tem teste (ex.: `0004_garantia_importada.sql`).
- **R-DAD-10**: Índices nas colunas de vínculo e de data (buscas, caixa e relatórios rápidos com milhares de registros).

## Migrações existentes

| Migração                  | O que faz                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `0000_init`               | usuários e sessões                                                                     |
| `0001_dominio`            | clientes, telefones, aparelhos, OS, pagamentos, parcelas, transações                   |
| `0002_empresa`            | dados da empresa                                                                       |
| `0003_indices`            | índices de vínculos e datas                                                            |
| `0004_garantia_importada` | piso de garantia do aparelho e recálculo das garantias existentes (R-GAR-02, R-GAR-03) |

## Onde está no código

- `apps/server/src/common/database/` (`connection.ts`: `migrarSchema`, `situacaoDoSchema`; `schema/`; `migrations/`)
- `apps/server/src/common/utils/` (`dates.ts`, `money.ts`, `pagination.ts`), `common/validation/decorators.ts`
  (`Opcional`, `DataIso`)
- `packages/shared/src/dinheiro.ts`

## Testes

- `packages/shared/src/dinheiro.spec.ts` — R-DAD-01.
- `apps/server/src/common/database/connection.spec.ts` — backup antes de migrar, sem cascata, banco mais novo, migração 0004 (R-DAD-08, R-DAD-09).
- `apps/server/test/regras.e2e-spec.ts` — `null` e datas inválidas viram 400 (R-DAD-02, R-DAD-07).

## Como mudar o banco

1. Altere o schema em `apps/server/src/common/database/schema/`.
2. Gere a migração: `pnpm --filter @brastem/server exec drizzle-kit generate --name <nome>`.
3. Se precisar mexer em dados existentes, acrescente o SQL na migração gerada (com `--> statement-breakpoint`).
4. Prefira acrescentar colunas (opcionais ou com valor padrão). Mudar ou remover coluna recria a tabela: teste
   com uma cópia do banco real antes de publicar.
5. Escreva o teste da migração em `connection.spec.ts`.
