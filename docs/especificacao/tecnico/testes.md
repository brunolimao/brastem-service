# Testes

> Como o projeto garante que o sistema faz o que esta especificação diz, e o que precisa acompanhar
> qualquer mudança.

**Prefixo das regras:** `R-TST`

## Regras

- **R-TST-01**: Toda mudança vem com teste que a cubra. Correção de defeito começa por um teste que reproduz o
  defeito e falha; funcionalidade nova traz testes do comportamento; regra alterada atualiza o teste dela.
- **R-TST-02**: O teste precisa pegar o defeito: depois de escrito, desfaz-se a correção e confere-se que ele
  falha pelo motivo certo (teste de mutação manual). Toda semana o Stryker faz o mesmo de forma automática nas
  regras de negócio do servidor e nas funções puras do client; o relatório mostra o que nenhum teste percebe.
- **R-TST-03**: Testes citam a regra que cobrem (`R-XXX-NN`) no nome ou num comentário, e a seção **Testes**
  do módulo lista os arquivos.
- **R-TST-04**: Cada pacote tem uma cobertura mínima de linhas e de condições (_branches_: os dois lados de cada
  `if`, `??`, `?:`), conferida no CI (`pnpm test:cobertura`). Ela só sobe: ao melhorar a cobertura, o mínimo
  acompanha (fica no inteiro abaixo do valor atual).
- **R-TST-05**: Teste de fumaça do app empacotado: antes de publicar uma versão, o workflow _Release_ abre o
  executável gerado com uma pasta de dados vazia e só segue se a janela carregar o sistema (pega janela em
  branco, servidor que não sobe, arquivo faltando no instalador).
- **R-TST-06**: Testes não dependem de relógio nem de espera fixa: datas fixas ou uma janela (ontem a amanhã);
  espera pelo resultado (`findBy*`, `waitFor`) ou relógio/espera injetados.
- **R-TST-07**: Nenhum dado real de cliente ou da loja entra em teste ou fixture (o repositório é público).
  Testes com o dump real são scripts descartáveis, apagados depois; o resultado vira teste com dados inventados.
  Para conferir na tela, `pnpm semear` sobe um app de demonstração com dados inventados.
- **R-TST-08**: Comparação de imagens: as fotos das telas principais (claro e escuro) e da OS impressa (os dois
  modelos) são comparadas com as aprovadas em `apps/client/visual/__fotos__`; mudança de layout ou de cor
  reprova (até 100 pixels de serrilhado passam). Mudança visual de propósito: conferir as fotos novas e aprová-las.

## Camadas

| Camada                                          | Ferramenta                                                      | Onde                                                 |
| ----------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Funções puras (dinheiro, datas, conversões)     | Vitest                                                          | `x.spec.ts` ao lado do arquivo, em todos os pacotes  |
| API: regras, permissões, validação, banco       | Vitest + Supertest com o Nest inteiro e SQLite em memória       | `apps/server/test/*.e2e-spec.ts`                     |
| Migrações do banco                              | Vitest com um banco da versão anterior                          | `apps/server/src/common/database/connection.spec.ts` |
| Telas, formulários, hooks, tratamento de erro   | Vitest + Testing Library (jsdom)                                | `apps/client/src/**/*.spec.tsx`                      |
| Telas inteiras: rota, URL, permissão, navegação | Roteador real em memória + servidor falso (`src/test/tela.tsx`) | `apps/client/src/test/telas/*.spec.tsx`              |
| Lógica do Electron                              | Vitest em módulos puros (o `main.ts` só liga as peças)          | `apps/desktop/src/*.spec.ts`                         |
| App instalado abrindo de verdade                | Teste de fumaça                                                 | `apps/desktop/scripts/fumaca.mjs`                    |
| Aparência das telas e da OS impressa            | Playwright (Edge) contra o build com dados inventados           | `apps/client/visual/*.visual.ts`                     |
| Testes que deixam passar mudanças (mutação)     | Stryker, toda semana (`mutacao.yml`)                            | `apps/{server,client}/stryker.config.mjs`            |
| Toda regra tem teste que a cite                 | Script                                                          | `scripts/conferir-regras.mjs`                        |
| Atualização automática de ponta a ponta         | Manual, com servidor local (ver `AGENTS.md`)                    | —                                                    |

## Comandos

- `pnpm test` — todos os testes.
- `pnpm test:cobertura` — testes com cobertura e o mínimo de cada pacote (o que o CI roda).
  Relatório em `coverage/` de cada pacote.
- `pnpm --filter @brastem/desktop fumaca` — teste de fumaça do app gerado em `apps/desktop/release`
  (feche o Brastem-Service antes: só abre uma instância).
- `pnpm --filter @brastem/client visual` — comparação de imagens (precisa do `pnpm build`);
  `... visual:aprovar` grava as fotos novas, depois de conferidas. Diferenças ficam em `apps/client/playwright-report`.
- `pnpm --filter @brastem/server mutacao` (ou `client`) — testes de mutação; relatório em `reports/mutacao`.
  Demora: para um arquivo só, `pnpm exec stryker run --mutate caminho/do/arquivo.ts` dentro do pacote.
- `pnpm regras` — confere que toda regra tem teste que a cite (R-TST-03).
- `pnpm sem-uso` — arquivos, exportações e dependências sem uso (knip).
- `pnpm semear` — app de demonstração com dados inventados em `http://127.0.0.1:3334` (admin / senha-de-teste-1).
- Antes de cada `git push`, o lefthook roda lint, `regras`, `sem-uso`, tipos e testes dos pacotes alterados.

## Onde está no código

- `apps/*/vitest.config.ts`, `apps/client/vite.config.ts`, `packages/shared/vitest.config.ts` (cobertura e mínimos)
- `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Skill `.claude/skills/testes/SKILL.md` (como testar cada tipo de mudança; só local, fora do repositório)

## Testes

- `apps/client/src/test/telas/*.spec.tsx` — cada tela aberta pela URL: login e volta à tela pedida, primeiro
  acesso, importação, telas só do administrador (R-ACE-06, R-ACE-01, R-PERM-03), listas com busca e páginas na
  URL, cadastro e edição, OS, caixa, pagamentos, relatórios, usuários e configurações.
- `packages/shared/src/enums.spec.ts` — valores gravados no banco não mudam (renomear exige migração).
- `scripts/conferir-regras.test.mjs` e `pnpm regras` (no CI) — toda regra tem teste que a cite ou está
  declarada sem teste automatizado (R-TST-03).
- `apps/client/visual/telas.visual.ts` (no CI) — fotos das telas e da OS impressa (R-TST-08, R-IMP-03). Validado
  trocando a cor do item ativo do menu (reprova com 7.394 pixels diferentes) e tirando o fundo cinza do rodapé da
  tabela (reprova com cerca de 40 mil). A lista de clientes é fotografada com 10 linhas, para o rodapé caber.
- Sem teste automatizado: R-TST-01, R-TST-02, R-TST-06 e R-TST-07 (regras de trabalho, conferidas na revisão)
  e R-TST-04 (o mínimo de cobertura é o próprio CI que confere).
- O próprio teste de fumaça foi validado por mutação: com o `main.ts` anterior à correção da janela em branco
  (R-ATU-10), ele reprova com "tempo esgotado"; com a correção, passa em cerca de 20 s.
