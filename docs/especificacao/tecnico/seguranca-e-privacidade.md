# Segurança e privacidade

> O que protege os dados da loja, a sessão dos usuários e o próprio app.

**Prefixo das regras:** `R-SEG`

Política de privacidade publicada (exigida pelo Google): [docs/privacidade.md](../../privacidade.md).

## Regras

**Servidor local**

- **R-SEG-01**: o servidor escuta só em `127.0.0.1`: outros computadores da rede não o alcançam.
- **R-SEG-02**: só atende pedidos endereçados ao próprio computador (cabeçalho `Host` = `127.0.0.1`,
  `localhost` ou `[::1]`) e, quando vierem de uma página, só da origem local. Isso impede que um site aberto
  no navegador mexa no app (por DNS rebinding ou formulário apontado para `127.0.0.1`).
- **R-SEG-03**: a API só aceita JSON (e os arquivos da importação e da restauração de backup como `application/octet-stream`); formulários
  HTML comuns não chegam a ela.
- **R-SEG-04**: política de conteúdo (CSP) estrita no app: scripts só do próprio app, nada em iframe, conexões
  só com o próprio app e o ViaCEP.

**Sessão e senhas**

- **R-SEG-05**: senhas com argon2; a sessão em cookies `httpOnly` e `SameSite=Strict` (o JavaScript da página não
  lê; outros sites não usam). Regras de duração e renovação: R-ACE-04.
- **R-SEG-06**: cada pedido confere se o usuário ainda existe e qual o papel atual (R-PERM-02).
- **R-SEG-07**: limite de tentativas de login e de primeiro acesso (R-ACE-03).
- **R-SEG-08**: a chave que assina as sessões é gerada por instalação, guardada fora do banco e fora dos backups.

**Dados**

- **R-SEG-09**: busca nunca monta SQL com texto do usuário: os campos pesquisáveis são uma lista fixa e todos
  os valores vão como parâmetros.
- **R-SEG-10**: restauração só por nome de arquivo da pasta de backups, nunca por caminho (R-BKP-08).
- **R-SEG-11**: os logs não guardam senhas, cookies nem o código de autorização do Google (a URL é registrada sem
  os parâmetros).
- **R-SEG-12**: o repositório é público: nada de dados de clientes, da empresa, `.env`, dumps, bancos ou chaves
  no código.

**App desktop**

- **R-SEG-13**: a janela roda isolada (`contextIsolation`, `sandbox`, sem Node na página); só navega dentro do
  próprio app; links externos só abrem se forem do login do Google; pedidos de permissão (câmera, microfone,
  localização...) são negados.
- **R-SEG-14**: o executável tem travas gravadas (fuses): não roda como Node, ignora `NODE_OPTIONS` e
  `--inspect`, só carrega o `app.asar` conferido. O app instalado se recusa a abrir com opções de depuração
  remota (`--remote-debugging-port` e afins).

**Atualizações e publicação**

- **R-SEG-15**: atualização conferida por SHA-512 (R-ATU-05). O instalador não é assinado, então quem
  conseguir publicar uma Release no repositório consegue entregar código a todos os clientes. Para reduzir
  esse risco: o build não tem permissão de escrita; a publicação é um job separado; as actions são fixadas
  por SHA; a versão precisa ser maior que a anterior.

## Pendências que dependem do dono do repositório

- Proteger as tags `v*` (ruleset) e ativar _Immutable releases_ no GitHub.
- Assinar o instalador (ex.: Azure Trusted Signing, pago): tira o aviso "editor desconhecido" e permite ao
  app conferir quem publicou a atualização.

## Onde está no código

- `apps/server/src/common/http/acesso-local.ts`, `apps/server/src/bootstrap.ts` (CSP, JSON, limites),
  `common/auth/`, `common/logger/logger.module.ts`
- `apps/desktop/src/main.ts`, `links-externos.ts`, `depuracao.ts`, `apps/desktop/electron-builder.yml` (fuses)
- `.github/workflows/release.yml`

## Testes

- `apps/server/test/seguranca.e2e-spec.ts` — Host e Origin, formulário HTML, importação, usuário excluído (R-SEG-02, R-SEG-03, R-SEG-06).
- `apps/server/test/auth.e2e-spec.ts` — sessão em cookies, renovação e reuso (R-SEG-05).
- `apps/server/test/limites.e2e-spec.ts` — limite de tentativas de login (R-SEG-07).
- `apps/desktop/src/links-externos.spec.ts`, `depuracao.spec.ts` — R-SEG-13, R-SEG-14.
