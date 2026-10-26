---

name: testes
description: Como testar qualquer mudança no Brastem-Service (servidor, front, desktop, app empacotado) e provar que o teste pega o defeito. Use sempre que mudar código: toda mudança precisa de teste que a cubra.
---

**Regra do projeto: nenhuma mudança fica sem teste.** Correção de defeito começa por um teste que reproduz
o defeito (e falha); funcionalidade nova vem com testes do comportamento esperado; mudança de regra atualiza
o teste da regra. Cite o código da regra da especificação (`R-XXX-NN`) no nome ou num comentário do teste.

## Onde e como testar

| O que mudou                                                       | Teste                                                                                                                                         | Exemplo a seguir                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Função pura (dinheiro, datas, conversões, parsing)                | unitário Vitest ao lado do arquivo (`x.spec.ts`)                                                                                              | `packages/shared/src/dinheiro.spec.ts`, `apps/server/src/legacy/legacy.spec.ts` |
| Regra de negócio, rota, permissão, validação da API               | e2e com o Nest inteiro e banco em memória (`apps/server/test/*.e2e-spec.ts`, Supertest)                                                       | `regras.e2e-spec.ts`, `seguranca.e2e-spec.ts`                                   |
| Banco: migração nova, mudança em dados existentes                 | `common/database/connection.spec.ts` (banco "da versão anterior" + migração nova)                                                             | teste `0004`                                                                    |
| Tela, formulário, componente                                      | Testing Library (`*.spec.tsx`), interagindo como o usuário (`getByRole`, `getByLabelText`)                                                    | `cliente-form.spec.tsx`, `data-table.spec.tsx`                                  |
| Schema Zod, conversão form → API                                  | `apps/client/src/models/models.spec.ts`                                                                                                       |                                                                                 |
| Hook (invalidação depois de salvar), `api.ts`, `query-client.ts`  | Vitest com `QueryClient` de verdade e `fetch` falso                                                                                           | `services/api.spec.ts`                                                          |
| Lógica do Electron                                                | extraia para um módulo puro em `apps/desktop/src/` e teste lá (o `main.ts` só liga as peças)                                                  | `carregamento.ts`, `atualizador.ts`                                             |
| Abertura do app instalado (janela, servidor embutido, instalador) | teste de fumaça: `pnpm --filter @brastem/desktop fumaca` (roda também no release, antes de publicar)                                          | `apps/desktop/scripts/fumaca.mjs`                                               |
| Algo que só se vê com dados reais (importação, migração)          | script descartável em `apps/server/scripts/_*.ts` com o dump real, **apagado depois**; o resultado vira teste permanente com dados inventados | contagens da garantia (R-IMPT-07)                                               |

## Provar que o teste pega o defeito

Um teste que passa com o defeito não protege nada. Depois de escrever o teste da correção:

1. desfaça a correção (ou troque a linha principal por uma versão errada);
2. rode só aquele teste e confirme que **falha** pelo motivo certo;
3. restaure a correção e confirme que passa.

## Bons hábitos

- Nada de espera por tempo fixo (`setTimeout` no teste): espere pelo resultado (`findBy*`, `waitFor`,
  `vi.waitFor`) ou injete o relógio/espera (`dormir`, `repetir`, `vi.useFakeTimers`).
- Datas: use datas fixas; se precisar de "hoje", use uma janela (ontem a amanhã) para não falhar perto da meia-noite.
- Cada `it` deve dizer o comportamento em português ("recusa…", "volta para…"). Evite depender de outro `it`;
  quando o fluxo exige ordem (e2e de um cadastro completo), deixe isso explícito no `describe`.
- Dados de clientes ou da loja reais **nunca** entram nos testes nem nos fixtures (o repositório é público).

## Antes de concluir

1. `pnpm test` (e `pnpm test:cobertura` para ver se a cobertura do pacote não caiu: o CI reprova se cair
   abaixo do mínimo configurado em cada `vitest.config`/`vite.config`).
2. Mudou algo que aparece na tela: confira no app rodando (`pnpm dev` + navegador do app).
3. Mudou o desktop, o instalador ou a abertura: gere o app (`pnpm --filter @brastem/desktop dist` ou
   `electron-builder --dir`) e rode o teste de fumaça.
4. Rode a skill `verificar` e atualize a especificação (skill `especificacao`), incluindo a seção **Testes**.
