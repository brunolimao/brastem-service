# Configurações

> Dados da empresa que saem na OS impressa e o controle do backup (no computador e no Google Drive).

**Prefixo das regras:** `R-CFG`

## Objetivo

Deixar a OS impressa com a cara da loja e dar ao dono controle sobre as cópias de segurança.
O funcionamento interno do backup está em [tecnico/backup-e-restauracao.md](../tecnico/backup-e-restauracao.md).

## Quem usa

Só o administrador.

## Telas

- _**Configurações**_ (menu › Sistema), em cartões. O usuário comum vê só **Aparência**,
  **Impressão da OS** e **Atualizações** (R-CFG-09).
  - **Dados da empresa**: nome, CNPJ, telefone, endereço, CEP.
  - **Aparência**: tamanho da letra (R-UX-05).
  - **Impressão da OS**: _Modelo novo_ ou _Igual ao sistema antigo_, neste computador (R-IMP-03).
  - **Atualizações**: versão instalada e _Procurar atualização_ (R-ATU-11).
  - **Suporte**: _Gerar diagnóstico_, que salva um .zip para mandar ao suporte (R-CFG-10).
  - **Backup automático**: último backup (quando, se foi automático ou manual, tamanho), onde está (computador
    e/ou Drive), próximo automático e o botão _Fazer backup agora_.
  - **Google Drive**: chaves do app do Google (Client ID e chave secreta), _Conectar ao Google Drive_, conta
    conectada, _Desconectar_.
  - **Restaurar um backup**: lista dos backups (computador e Drive) com data e tamanho, e _Restaurar_.

## Campos

| Campo                   | Obrigatório        | Formato / limite | Observação                                               |
| ----------------------- | ------------------ | ---------------- | -------------------------------------------------------- |
| Nome da empresa         | não                | até 120          |                                                          |
| CNPJ                    | não                | até 30           |                                                          |
| Telefone                | não                | até 30           |                                                          |
| Endereço                | não                | até 200          |                                                          |
| CEP                     | não                | até 20           |                                                          |
| Client ID do Google     | sim, para conectar | texto            | criado no Google Cloud (ver docs/backup-google-drive.md) |
| Chave secreta do Google | sim, para conectar | texto            | nunca é devolvida pela API depois de salva               |

## Regras

- **R-CFG-01**: os dados da empresa começam vazios e **nunca** ficam no código (o repositório é público); a
  impressão mostra só o que foi preenchido (R-IMP-01).
- **R-CFG-02**: qualquer usuário logado lê os dados da empresa (a impressão precisa); só o administrador altera.
- **R-CFG-03**: _Fazer backup agora_ faz a cópia e, se o Drive estiver conectado, envia. Um backup por vez:
  outro pedido durante um backup em andamento é recusado.
- **R-CFG-04**: conectar o Google abre o navegador do Windows na página de autorização do Google; ao autorizar,
  o app mostra "Google Drive conectado". O acesso pedido é só aos arquivos que o próprio app cria.
- **R-CFG-05**: restaurar não troca os dados na hora: prepara a troca e reinicia o app; os dados atuais são
  guardados como backup antes da troca (ver R-BKP-*).
- **R-CFG-06**: a lista de restauração mostra os backups do dia a dia e as cópias automáticas feitas antes de
  uma restauração ou de uma atualização do banco.
- **R-CFG-07**: _Restaurar de um arquivo_ (no cartão _Restaurar um backup_) escolhe um backup no computador
  (`.gz` ou `.sqlite`) e pede a mesma confirmação, mostrando o nome do arquivo (R-BKP-10).
- **R-CFG-08**: _Começar do zero_ (último cartão) apaga todos os dados depois de mostrar o que é apagado (inclusive
  todos os usuários), o que continua (backups e Google Drive), o que acontece depois (primeiro acesso ou
  importação) e como desfazer; o botão só funciona com a senha de quem está logado (R-BKP-12).
- **R-CFG-09**: a tela abre para todos; o usuário comum vê só **Aparência**, **Impressão da OS** e **Atualizações**. Dados da empresa, backup,
  restauração e começar do zero nem aparecem para ele (e a tela não consulta essas rotas, que o servidor
  recusa a quem não é administrador).
- **R-CFG-10**: _Gerar diagnóstico_ (só administrador) salva `diagnostico-brastem-AAAA-MM-DD.zip` com
  `diagnostico.json` (versão do app, do Windows, do Node e do Electron; memória; tamanho e migrações do banco;
  quantidade de registros por tabela; situação do backup) e os 3 registros (logs) diários mais recentes. Não leva
  dados de clientes nem da empresa, senhas, chaves nem o e-mail da conta do Google. O arquivo fica no computador:
  o próprio administrador decide se e para quem envia.

## Permissões

| Ação                                     | Administrador | Usuário comum     |
| ---------------------------------------- | ------------- | ----------------- |
| Aparência (tamanho da letra)             | sim           | sim               |
| Modelo de impressão da OS                | sim           | sim               |
| Todo o resto desta tela                  | sim           | não (nem aparece) |
| Ler os dados da empresa (pela impressão) | sim           | sim               |

## API

| Método e rota                                                                                         | Para quê                          | Quem pode                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- |
| `GET /api/empresa`                                                                                    | dados da empresa (R-CFG-02)       | logado                           |
| `PUT /api/empresa`                                                                                    | salva os dados da empresa         | administrador                    |
| `GET /api/backup/estado`, `GET /api/backup/arquivos`                                                  | situação e lista de backups       | administrador                    |
| `POST /api/backup/executar`                                                                           | backup agora (R-CFG-03)           | administrador                    |
| `POST /api/backup/restaurar`                                                                          | prepara a restauração (R-CFG-05)  | administrador                    |
| `POST /api/backup/apagar-tudo` (corpo: `{ senha }`)                                                   | começar do zero (R-CFG-08)        | administrador                    |
| `POST /api/backup/restaurar/arquivo` (corpo: o arquivo, `application/octet-stream`)                   | restaura de um arquivo (R-CFG-07) | administrador                    |
| `POST /api/backup/google/credenciais`, `GET /api/backup/google/conectar`, `DELETE /api/backup/google` | Google Drive                      | administrador                    |
| `GET /api/backup/google/callback`                                                                     | retorno da autorização do Google  | público (protegido pelo `state`) |
| `GET /api/sistema/diagnostico`                                                                        | .zip para o suporte (R-CFG-10)    | administrador                    |

## Onde está no código

- Server: `apps/server/src/modules/empresa/`, `modules/backup/`, `modules/sistema/diagnostico.service.ts`
- Client: `routes/_app/configuracoes.tsx`, `components/domain/empresa-card.tsx`, `aparencia-card.tsx`, `seletor-modelo-impressao.tsx`, `atualizacao-card.tsx`, `diagnostico-card.tsx`, `backup-*.tsx`

## Testes

- `apps/server/test/empresa.e2e-spec.ts` — dados da empresa e permissões (R-CFG-01, R-CFG-02).
- `apps/server/test/backup.e2e-spec.ts` — backup, Google (com um Google falso), restauração (R-CFG-03 a R-CFG-06).
- `apps/client/src/test/telas/administracao.spec.tsx` — usuário comum vê só Aparência, Impressão da OS e Atualizações (R-CFG-09).
- `apps/client/src/components/domain/apagar-tudo-card.spec.tsx` — consequências claras, senha obrigatória, senha errada não sai do sistema (R-CFG-08).
- `apps/client/src/components/domain/backup.spec.tsx` — cartões de backup e Google Drive, lista e confirmação de restauração, restaurar de um arquivo (R-CFG-03 a R-CFG-07).
- `apps/client/src/components/domain/usuario-e-empresa.spec.tsx` — dados da empresa começam vazios e saem com máscara (R-CFG-01).
- `apps/server/test/sistema.e2e-spec.ts` e `apps/client/src/components/domain/diagnostico-card.spec.tsx` — conteúdo do .zip, nada de dados de clientes nem e-mail, só administrador, download com a data no nome (R-CFG-10).
