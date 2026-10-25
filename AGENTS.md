# Brastem-Service v2

App desktop (Electron) de gestão de assistência técnica: clientes, aparelhos, ordens de serviço (OS),
pagamentos/parcelas, receitas/despesas, caixa, relatórios e usuários. Roda local, sem custo; backup no Google Drive.
Todo texto de interface, mensagem de erro e validação é em **pt-BR**.

## Monorepo (pnpm + Turborepo)

- `apps/client`: React + Vite + TS, TanStack (Router/Query/Table/Form), Zod, Zustand, shadcn/Tailwind, echarts, sonner.
- `apps/server`: NestJS + Drizzle + SQLite (better-sqlite3), Joi (envs), pino, Swagger, class-validator.
- `apps/desktop`: Electron; sobe o server em 127.0.0.1 e abre o client buildado.
- `packages/shared`: enums/constantes comuns (`@brastem/shared`). `packages/tsconfig`: bases de TS.

## Comandos (na raiz)

`pnpm dev` · `pnpm build` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm lint:fix`
Antes de concluir qualquer tarefa: lint, typecheck e test devem passar.

## Convenções

- Biome é a única fonte de estilo (aspas simples, sem ponto e vírgula, 100 colunas). Não adicionar ESLint/Prettier.
- TypeScript estrito; sem `any`. Tipos de enum vêm de `@brastem/shared`, nunca duplicados.
- **Dinheiro** é inteiro em centavos no banco e na API; formatar só na borda (UI). **Datas** são ISO no banco/API; exibir em `dd/MM/yyyy` com date-fns `ptBR`.
- Nunca interpolar coluna vinda do cliente em query: busca usa lista fixa de campos permitidos.
- Gravações de OS + pagamentos + parcelas sempre em transação. O better-sqlite3 é síncrono: o callback de `db.transaction((tx) => ...)` não pode ser `async`; helpers que gravam recebem `DbLike` (banco ou `tx`) e usam `.run()`/`.get()`/`.all()`.
- Dinheiro na API é inteiro em centavos; datas são `yyyy-MM-dd`. Listagens retornam `{ items, total, page, pageSize }`; períodos (`inicio`/`fim`) são inclusivos.
- Auth: JWT em cookie httpOnly (SameSite=Strict), refresh rotacionado, senha com argon2. Falha de auth = 401/403, nunca 500.
- Segredos só em env (validadas por Joi); nunca commitar `.env`.

### Server (`apps/server/src`)

`common/{config,database,logger,auth,filters,interceptors,pipes,validation,utils}` e `modules/<modulo>/`
com `x.module.ts`, `x.controller.ts`, `x.service.ts`, `dto/`, `x.service.spec.ts`. DTOs com mensagens de validação em pt-BR.
Rotas sob `/api`; documentar com decorators do Swagger.

### Client (`apps/client/src`)

`components/{ui,layout,data-table,form,domain}`, `routes/` (file-based), `services/` (um por módulo, via `api.ts`),
`hooks/` (queries/mutations e stores zustand), `libs/`, `models/` (tipos + schemas Zod).
Erros de API viram toast no `libs/query-client.ts` (QueryCache/MutationCache); `services/api.ts` só lança `ApiError` e renova a sessão em 401. Não tratar toast de erro em cada tela; só toast de sucesso nas mutations. Search params de listagem: use `libs/search-params.ts` (o roteador converte "123" em número ao ler a URL). Gráficos: `components/charts/` (echarts com import parcial; a opção do gráfico é função pura em `opcao-pizza.ts`). Telas com período usam `FiltroPeriodo` e `libs/periodo.ts` (datas inclusivas, padrão = mês atual). Dev: `pnpm dev` sobe server (3333) e client (5173, com proxy de `/api`). Reutilizar `DataTable`, campos de `components/form` e `PrintOS`; não copiar telas.
Visual: tema azul da logo, destaque `#FF6347`, componentes shadcn sem estilo ad hoc.

## App desktop (apps/desktop)
- Electron sobe o servidor Nest dentro do próprio processo, em `127.0.0.1` (porta 47831 ou outra livre), e abre uma janela nesse endereço. O servidor entrega o front (`CLIENT_DIR`), então front e API ficam na mesma origem.
- Dados em `%APPDATA%Brastem-Servicedados` (SQLite, logs, `segredo.key` gerado na primeira abertura). `BRASTEM_PASTA_DADOS` troca essa pasta (testes).
- `pnpm --filter @brastem/desktop start` roda o app; `... dist` gera o instalador em `apps/desktop/release`. `pnpm preparar` monta `.stage` (server via `pnpm deploy --config.node-linker=hoisted` + front). Atenção: `pnpm stage` é comando do próprio pnpm 12, por isso o script se chama `preparar`.
- O electron-builder descarta `node_modules` em `extraResources`; elas entram pelo gancho `scripts/depois-de-empacotar.cjs`. O `better-sqlite3` 13 traz binário pronto (`prebuilds/win32-x64.node`), então não há recompilação.
- Primeiro uso: `/primeiro-acesso` (cria o admin) ou `/importar` (envia o .sql do sistema antigo para `POST /api/import/legacy`, só antes de existir usuário).

## Skills do projeto (`.claude/skills`)

`novo-modulo-server` · `nova-tela-client` · `verificar`
