# Testes

> Como o projeto garante que o sistema faz o que esta especificação diz, e o que precisa acompanhar
> qualquer mudança.

**Prefixo das regras:** `R-TST`

## Regras

- **R-TST-01**: Toda mudança vem com teste que a cubra. Correção de defeito começa por um teste que reproduz o
  defeito e falha; funcionalidade nova traz testes do comportamento; regra alterada atualiza o teste dela.
- **R-TST-02**: O teste precisa pegar o defeito: depois de escrito, desfaz-se a correção e confere-se que ele
  falha pelo motivo certo (teste de mutação manual).
- **R-TST-03**: Testes citam a regra que cobrem (`R-XXX-NN`) no nome ou num comentário, e a seção **Testes**
  do módulo lista os arquivos.
- **R-TST-04**: Cada pacote tem uma cobertura mínima de linhas, conferida no CI (`pnpm test:cobertura`). Ela
  só sobe: ao melhorar a cobertura, o mínimo acompanha.
- **R-TST-05**: Teste de fumaça do app empacotado: antes de publicar uma versão, o workflow _Release_ abre o
  executável gerado com uma pasta de dados vazia e só segue se a janela carregar o sistema (pega janela em
  branco, servidor que não sobe, arquivo faltando no instalador).
- **R-TST-06**: Testes não dependem de relógio nem de espera fixa: datas fixas ou uma janela (ontem a amanhã);
  espera pelo resultado (`findBy*`, `waitFor`) ou relógio/espera injetados.
- **R-TST-07**: Nenhum dado real de cliente ou da loja entra em teste ou fixture (o repositório é público).
  Testes com o dump real são scripts descartáveis, apagados depois; o resultado vira teste com dados inventados.

## Camadas

| Camada                                        | Ferramenta                                                | Onde                                                 |
| --------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Funções puras (dinheiro, datas, conversões)   | Vitest                                                    | `x.spec.ts` ao lado do arquivo, em todos os pacotes  |
| API: regras, permissões, validação, banco     | Vitest + Supertest com o Nest inteiro e SQLite em memória | `apps/server/test/*.e2e-spec.ts`                     |
| Migrações do banco                            | Vitest com um banco da versão anterior                    | `apps/server/src/common/database/connection.spec.ts` |
| Telas, formulários, hooks, tratamento de erro | Vitest + Testing Library (jsdom)                          | `apps/client/src/**/*.spec.tsx`                      |
| Lógica do Electron                            | Vitest em módulos puros (o `main.ts` só liga as peças)    | `apps/desktop/src/*.spec.ts`                         |
| App instalado abrindo de verdade              | Teste de fumaça                                           | `apps/desktop/scripts/fumaca.mjs`                    |
| Atualização automática de ponta a ponta       | Manual, com servidor local (ver `AGENTS.md`)              | —                                                    |

## Comandos

- `pnpm test` — todos os testes.
- `pnpm test:cobertura` — testes com cobertura e o mínimo de cada pacote (o que o CI roda).
  Relatório em `coverage/` de cada pacote.
- `pnpm --filter @brastem/desktop fumaca` — teste de fumaça do app gerado em `apps/desktop/release`
  (feche o Brastem-Service antes: só abre uma instância).

## Onde está no código

- `apps/*/vitest.config.ts`, `apps/client/vite.config.ts`, `packages/shared/vitest.config.ts` (cobertura e mínimos)
- `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Skill `.claude/skills/testes/SKILL.md` (como testar cada tipo de mudança)

## Testes

- O próprio teste de fumaça foi validado por mutação: com o `main.ts` anterior à correção da janela em branco
  (R-ATU-10), ele reprova com "tempo esgotado"; com a correção, passa em cerca de 20 s.
