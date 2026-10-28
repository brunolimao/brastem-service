# Brastem-Service

Sistema de gestão para assistência técnica de eletrodomésticos: clientes e aparelhos, ordens de serviço
com impressão, pagamentos e parcelas, caixa, receitas e despesas, relatórios com gráficos e usuários.
Roda como **aplicativo de desktop (Windows)**, com tudo dentro do computador (sem servidor, sem mensalidade),
backup automático no Google Drive e atualização automática.

> Todo texto da interface, das mensagens de erro e da validação é em português do Brasil.

**Especificação** (o que cada parte faz, regras de negócio numeradas, permissões, decisões): [docs/especificacao](docs/especificacao/README.md).

## Como é por dentro

| Pasta             | O que é                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/client`     | Front: React, Vite, TypeScript, TanStack (Router, Query, Form, Table), Zod, Zustand, shadcn/ui, ECharts |
| `apps/server`     | API: NestJS, SQLite (Drizzle), Joi, pino, Swagger, login com JWT em cookie httpOnly                     |
| `apps/desktop`    | Electron: sobe a API dentro do app, abre a janela e cuida do instalador e das atualizações              |
| `packages/shared` | Enumerações e constantes usadas pelo front e pelo back                                                  |

Monorepo com **pnpm + Turborepo**; padronização com **Biome** e testes com **Vitest**.
As convenções do projeto estão em [`AGENTS.md`](AGENTS.md).

## Desenvolvimento

Requisitos: pnpm (`npm i -g pnpm`). O Node do projeto (24, o mesmo do Electron) o pnpm baixa sozinho.

```bash
pnpm install
pnpm --filter @brastem/server dev      # API em http://127.0.0.1:3333 (Swagger em /docs)
pnpm --filter @brastem/client dev      # front em http://127.0.0.1:5173 (já faz proxy da API)
```

Verificações (as mesmas do CI):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Aplicativo desktop

```bash
pnpm build
pnpm --filter @brastem/desktop start   # abre o app (usa uma pasta de dados do seu usuário)
pnpm --filter @brastem/desktop dist    # gera o instalador em apps/desktop/release
```

Os dados ficam em `%APPDATA%\Brastem-Service\dados`. Backup no Google Drive:
[`docs/backup-google-drive.md`](docs/backup-google-drive.md).

### Importar os dados do sistema antigo

Na primeira abertura, em vez de criar o administrador, use **Importar os dados** e escolha o arquivo `.sql`
gerado pelo `mysqldump` do sistema antigo. Clientes, ordens de serviço, pagamentos e usuários são trazidos,
e as senhas antigas continuam valendo.

## Lançar uma versão

O instalador e as atualizações são publicados pelo GitHub Actions:

```bash
git tag v2.0.1
git push origin v2.0.1
```

O workflow **Release** roda as verificações, gera `Brastem-Service Setup 2.0.1.exe` e o publica nas
[Releases](../../releases). Os aplicativos instalados procuram versões novas ao abrir e a cada 4 horas,
baixam em segundo plano e perguntam se podem reiniciar (ou instalam sozinhos ao fechar).
Também dá para conferir em **Ajuda → Verificar atualizações**.

> O instalador não é assinado digitalmente, então o Windows pode mostrar o aviso "editor desconhecido"
> na primeira instalação.

## Segurança e privacidade

- O código **não contém** senhas, chaves nem dados de clientes. O segredo do login é gerado em cada
  instalação e fica só na pasta de dados do usuário.
- O servidor embutido escuta apenas em `127.0.0.1`.
- Senhas de usuários ficam com hash (argon2); o login usa cookies `httpOnly` + `SameSite=Strict`.
- As chaves do Google Drive ficam fora do banco, para não irem junto nos backups.

Encontrou um problema de segurança? Abra uma issue privada em _Security → Report a vulnerability_.
