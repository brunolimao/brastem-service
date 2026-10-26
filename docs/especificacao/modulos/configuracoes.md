# Configurações

> Dados da empresa que saem na OS impressa e o controle do backup (no computador e no Google Drive).

**Prefixo das regras:** `R-CFG`

## Objetivo

Deixar a OS impressa com a cara da loja e dar ao dono controle sobre as cópias de segurança.
O funcionamento interno do backup está em [tecnico/backup-e-restauracao.md](../tecnico/backup-e-restauracao.md).

## Quem usa

Só o administrador.

## Telas

- _**Configurações**_ (menu › Administração), em cartões:
  - **Dados da empresa**: nome, CNPJ, telefone, endereço, CEP.
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

## Permissões

| Ação                                     | Administrador | Usuário comum |
| ---------------------------------------- | ------------- | ------------- |
| Tudo nesta tela                          | sim           | não           |
| Ler os dados da empresa (pela impressão) | sim           | sim           |

## API

| Método e rota                                                                                         | Para quê                         | Quem pode                        |
| ----------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| `GET /api/empresa`                                                                                    | dados da empresa (R-CFG-02)      | logado                           |
| `PUT /api/empresa`                                                                                    | salva os dados da empresa        | administrador                    |
| `GET /api/backup/estado`, `GET /api/backup/arquivos`                                                  | situação e lista de backups      | administrador                    |
| `POST /api/backup/executar`                                                                           | backup agora (R-CFG-03)          | administrador                    |
| `POST /api/backup/restaurar`                                                                          | prepara a restauração (R-CFG-05) | administrador                    |
| `POST /api/backup/google/credenciais`, `GET /api/backup/google/conectar`, `DELETE /api/backup/google` | Google Drive                     | administrador                    |
| `GET /api/backup/google/callback`                                                                     | retorno da autorização do Google | público (protegido pelo `state`) |

## Onde está no código

- Server: `apps/server/src/modules/empresa/`, `modules/backup/`
- Client: `routes/_app/configuracoes.tsx`, `components/domain/empresa-card.tsx`, `backup-*.tsx`

## Testes

- `apps/server/test/empresa.e2e-spec.ts` — dados da empresa e permissões (R-CFG-01, R-CFG-02).
- `apps/server/test/backup.e2e-spec.ts` — backup, Google (com um Google falso), restauração (R-CFG-03 a R-CFG-06).
