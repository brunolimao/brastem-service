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

`pnpm dev` · `pnpm build` · `pnpm test` · `pnpm test:cobertura` · `pnpm typecheck` · `pnpm lint` · `pnpm lint:fix`
Antes de concluir qualquer tarefa: lint, typecheck e test devem passar.

## Testes: obrigatórios em toda mudança

**Nada é feito sem teste que cubra.** Correção de defeito começa por um teste que reproduz o defeito e falha;
funcionalidade nova traz os testes do comportamento; regra alterada atualiza o teste da regra. Depois, prove que
o teste pega o problema (desfaça a correção, veja falhar, restaure). Mudança visível na tela é conferida no app
rodando; mudança no desktop/instalador passa pelo teste de fumaça (`pnpm --filter @brastem/desktop fumaca`).
Como e onde testar cada camada: skill `testes`. A cobertura mínima de cada pacote é conferida no CI.

## Convenções

- Biome é a única fonte de estilo (aspas simples, sem ponto e vírgula, 100 colunas). Não adicionar ESLint/Prettier.
- TypeScript estrito; sem `any`. Tipos de enum vêm de `@brastem/shared`, nunca duplicados.
- **Dinheiro** é inteiro em centavos no banco e na API; formatar só na borda (UI). **Datas** são ISO no banco/API; exibir em `dd/MM/yyyy` com date-fns `ptBR`.
- Nunca interpolar coluna vinda do cliente em query: busca usa lista fixa de campos permitidos.
- Gravações de OS + pagamentos + parcelas sempre em transação. O better-sqlite3 é síncrono: o callback de `db.transaction((tx) => ...)` não pode ser `async`; helpers que gravam recebem `DbLike` (banco ou `tx`) e usam `.run()`/`.get()`/`.all()`.
- Dinheiro na API é inteiro em centavos; datas são `yyyy-MM-dd`. Listagens retornam `{ items, total, page, pageSize }`; períodos (`inicio`/`fim`) são inclusivos.
- Auth: JWT em cookie httpOnly (SameSite=Strict), refresh rotacionado, senha com argon2. Falha de auth = 401/403, nunca 500.
- Segredos só em env (validadas por Joi); nunca commitar `.env`.

- Garantia do aparelho: sempre `recalcularGarantia` (`modules/ordens-servico/garantia.ts`): a maior entre as OS fechadas (fechamento + dias) e `garantiaImportada` (a que veio do sistema antigo, que é um piso). O sistema antigo não somava garantias escritas como texto ("90 DIAS"); a importação corrige isso e avisa no relatório.

### Server (`apps/server/src`)

`common/{config,database,logger,auth,filters,interceptors,pipes,validation,utils}` e `modules/<modulo>/`
com `x.module.ts`, `x.controller.ts`, `x.service.ts`, `dto/`, `x.service.spec.ts`. DTOs com mensagens de validação em pt-BR.
Rotas sob `/api`; documentar com decorators do Swagger.

### Client (`apps/client/src`)

`components/{ui,layout,data-table,form,domain}`, `routes/` (file-based), `services/` (um por módulo, via `api.ts`),
`hooks/` (queries/mutations e stores zustand), `libs/`, `models/` (tipos + schemas Zod).
Erros de API viram toast no `libs/query-client.ts` (QueryCache/MutationCache); `services/api.ts` só lança `ApiError` e renova a sessão em 401. Não tratar toast de erro em cada tela; só toast de sucesso nas mutations. Search params de listagem: use `libs/search-params.ts` (o roteador converte "123" em número ao ler a URL). Gráficos: `components/charts/` (echarts com import parcial; a opção do gráfico é função pura em `opcao-pizza.ts`). Telas com período usam `FiltroPeriodo` e `libs/periodo.ts` (datas inclusivas, padrão = mês atual). Dev: `pnpm dev` sobe server (3333) e client (5173, com proxy de `/api`). Reutilizar `DataTable`, campos de `components/form` e `PrintOS`; não copiar telas. **Toda tabela usa `DataTable`**, que sempre pagina: lista que pode crescer pagina no servidor (`{ items, total, page, pageSize }` + `paginacao`, com `page` na URL); lista pequena pagina sozinha na tabela (20 por página). Formulários usam `useAppForm` (`components/form/form-hook.ts`, `createFormHook`): `<form.AppField name="x">{(campo) => <campo.CampoTexto rotulo="X" />}</form.AppField>` e `<form.AppForm><form.BotaoSalvar /></form.AppForm>`; campo novo é registrado no hook e lê o campo com `useFieldContext` (moldura comum em `MolduraCampo`). Grupos de campos usados em mais de um formulário são `withFieldGroup` (ex.: `PagamentosCampos`, com `fields={{ pagamentos: 'pagamentos' }}`). Nada de `any`.
Visual: tema azul da logo, destaque `#FF6347`, componentes shadcn sem estilo ad hoc.

## App desktop (apps/desktop)

- Electron sobe o servidor Nest dentro do próprio processo, em `127.0.0.1` (porta 47831 ou outra livre), e abre uma janela nesse endereço. O servidor entrega o front (`CLIENT_DIR`), então front e API ficam na mesma origem.
- Dados em `%APPDATA%Brastem-Servicedados` (SQLite, logs, `segredo.key` gerado na primeira abertura). `BRASTEM_PASTA_DADOS` troca essa pasta (testes).
- `pnpm --filter @brastem/desktop start` roda o app; `... dist` gera o instalador em `apps/desktop/release`. `pnpm preparar` monta `.stage` (server via `pnpm deploy --config.node-linker=hoisted` + front). Atenção: `pnpm stage` é comando do próprio pnpm 12, por isso o script se chama `preparar`.
- O electron-builder descarta `node_modules` em `extraResources`; elas entram pelo gancho `scripts/depois-de-empacotar.cjs`. O `better-sqlite3` 13 traz binário pronto (`prebuilds/win32-x64.node`), então não há recompilação.
- O ícone do app fica em `apps/desktop/recursos/icon.png` (a pasta `build/` é ignorada pelo git, então o instalador do CI saía com o ícone do Electron; há teste que confere). Atualização: o aviso de procurando/baixando/instalando vem de `aviso-atualizacao.ts`; o instalador é "um clique" (`oneClick`, sem escolher pasta) e a atualização usa `quitAndInstall(false, true)`, para o Windows mostrar a janela de progresso até o app reabrir; o app avisa "instalando" antes de fechar.
- Instalador "um clique" (`oneClick`): ele instala em `Programs\<nome do pacote>`; por isso `electron-builder.yml` fixa `extraMetadata.name: Brastem-Service`, senão ele instalava em `Programs\@brastemdesktop` e deixava duas cópias. Foi validado de ponta a ponta (2.0.5 → 2.0.7 → 2.0.8) com servidor local de atualização.
- Primeiro uso: `/primeiro-acesso` (cria o admin) ou `/importar` (envia o .sql do sistema antigo para `POST /api/import/legacy`, só antes de existir usuário).

## Repositório, CI e releases

- Repositório público: <https://github.com/brunolimao/brastem-service> (branch `main`). Commits com o e-mail privado do GitHub (`64761402+brunolimao@users.noreply.github.com`; configurado no `git config` local). Nunca commitar `.env`, dumps `.sql`, bancos nem chaves: o repositório é público.
- Dados da empresa (nome, CNPJ, telefone, endereço) **nunca** vão no código: ficam na tabela `empresa`, preenchidos em Configurações, e o cabeçalho da OS impressa mostra só o que foi preenchido. Idem para qualquer dado de cliente ou de loja: o repositório é público.
- `.github/workflows/ci.yml` roda lint, typecheck, test e build no Windows a cada push/PR. `release.yml` roda ao empurrar uma tag `v*` (publica o instalador nas Releases e libera o auto-update); "Run workflow" manual só gera o instalador como artefato de teste, sem publicar.
- Para lançar: `git tag v2.0.1 && git push origin v2.0.1` (a versão do instalador vem da tag). O app instalado usa `electron-updater` (`apps/desktop/src/atualizador.ts`), consultando as Releases ao abrir e a cada 4 h.
- Todo pacote deve declarar o que importa: o CI instala em ambiente limpo e não enxerga dependências herdadas por acaso (foi assim que o `express` apareceu faltando).

## Windows com pastas criptografadas (EFS)

- Em alguns perfis (ex.: empresa) `AppDataLocal` e `AppDataRoaming` são criptografadas e **`rename` falha com `EXDEV` dentro delas**, mesmo na mesma pasta. Por isso: no servidor, mover arquivo é sempre `moverArquivo` (`common/utils/arquivos.ts`: tenta `rename`, cai para copiar+apagar); no desktop, o cache do auto-update vai para a primeira pasta onde um rename de teste funciona (`cache-atualizacao.ts` + `criar-atualizador.ts`).
- `criar-atualizador.ts` usa um adaptador próprio do electron-updater, que deixa o `httpExecutor` vazio: ele é atribuído à mão e a versão do pacote é **fixa** (sem ^). Há teste que quebra se isso mudar. Ao atualizar o electron-updater, rode o teste de atualização de verdade (abaixo).
- O app instalado se recusa a abrir com opções de depuração (`--remote-debugging-port`, `--inspect`...; `src/depuracao.ts`) e os fuses desligam RunAsNode/NODE_OPTIONS. Para inspecionar a janela em testes, use `pnpm --filter @brastem/desktop start` (não empacotado) ou captura de tela.
- Testar atualização sem publicar: compile duas versões com `electron-builder --publish never -c.extraMetadata.version=X` usando um `publish` genérico apontando para `http://127.0.0.1:PORTA/`, instale a menor (`Setup.exe /S /D=pasta`) e sirva a maior (`latest.yml` + `.exe`). O app reaberto pelo instalador **não herda** variáveis de ambiente de teste (usa a pasta de dados padrão). Desinstale com `Uninstall Brastem-Service.exe /S`.

## Backup (apps/server/src/modules/backup)

- Cópia do SQLite pela API de backup do better-sqlite3 (`sqlite.backup`), compactada em `dados/backups` (7 locais) e enviada ao Google Drive (30 no Drive) quando conectado. O agendador confere de hora em hora se já passaram 24 h; envio que falha fica `pendenteDrive` e é retentado sem criar novo snapshot.
- Google por REST (sem SDK): OAuth de app para computador com PKCE e retorno em `http://127.0.0.1:<porta>/api/backup/google/callback`; escopo só `drive.file`. Credenciais, refresh token e pasta ficam em `dados/integracoes/google.json`, fora do banco (para não irem nos backups). Guia do Google Cloud: `docs/backup-google-drive.md`.
- Restaurar nunca troca o banco aberto: `RestauracaoService` valida o backup e grava `restauracao-pendente.sqlite`; `aplicarRestauracaoPendente` (em `connection.ts`) faz a troca na próxima abertura e guarda o banco antigo em `backups/antes-da-restauracao-*`. O evento `brastem:reiniciar` no `process` faz o Electron reabrir sozinho.
- Antes de aplicar migrações pendentes, `migrarSchema` grava `backups/antes-da-migracao-*.sqlite` (restaurável pela tela, como `antes-da-restauracao-*`; padrão em `PADRAO_BACKUP_LOCAL`) e roda com chaves estrangeiras desligadas (recriar tabela com elas ligadas apagaria OS em cascata). Banco de versão mais nova é recusado ao abrir e ao restaurar.
- Rotas públicas dentro de controller com `@Roles` continuam públicas (`RolesGuard` respeita `@Public`). Testes de backup usam um Google falso em `test/google-falso.ts` (`vi.stubGlobal('fetch')`).
- Cabeçalho de card com botão: use `CardAction` (o `CardHeader` do shadcn é uma grade; `flex-row` não funciona).

## Especificação (`docs/especificacao`)

O que o sistema faz e por quê: um arquivo por módulo (`modulos/`) e por tema técnico (`tecnico/`), regras
numeradas (`R-OS-03`, `R-GAR-02`...), decisões em `historico/decisoes.md`. **Antes** de mudar regra, tela,
permissão, rota ou banco, consulte o arquivo do assunto; **na mesma alteração**, atualize-o no padrão da
skill `especificacao` (modelo em `docs/especificacao/_modelo-modulo.md`). Cite os códigos das regras nos testes.

## Skills do projeto (`.claude/skills`)

`testes` · `especificacao` · `novo-modulo-server` · `nova-tela-client` · `verificar`
