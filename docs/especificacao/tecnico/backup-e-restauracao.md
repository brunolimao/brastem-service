# Backup e restauração

> Uma cópia dos dados por dia, no computador e no Google Drive, e um jeito seguro de voltar no tempo.

**Prefixo das regras:** `R-BKP`

Guia de configuração do Google Cloud (para quem instala): [docs/backup-google-drive.md](../../backup-google-drive.md).
A tela está em [modulos/configuracoes.md](../modulos/configuracoes.md).

## Regras

- **R-BKP-01**: Quando: um minuto depois de abrir o app e depois a cada hora, o app confere se já passaram
  24 horas do último backup; se sim, faz um. Computador desligado na hora "certa" não pula o dia: o backup
  sai na próxima abertura.
- **R-BKP-02**: O quê: cópia consistente do banco feita pela API de backup do SQLite (sem travar quem está
  usando), compactada: `brastem-aaaa-mm-dd-hhmmss.sqlite.gz`.
- **R-BKP-03**: Onde e quantos: na pasta `backups` (guarda os 7 mais recentes) e, se conectado, na pasta
  "Brastem-Service Backups" do Google Drive (guarda os 30 mais recentes).
- **R-BKP-04**: Sem internet: o backup local sai normalmente e o envio ao Drive fica pendente; é tentado de
  novo a cada hora, sem fazer outra cópia. Nunca dois envios ao mesmo tempo.
- **R-BKP-05**: Google: autorização do tipo "app para computador" com PKCE e retorno em `127.0.0.1`. Permissão
  só para os arquivos que o próprio app cria (`drive.file`) e para ler o e-mail da conta. As chaves ficam fora
  do banco, para não irem nos backups.
- **R-BKP-06**: Restaurar (só administrador): o arquivo escolhido é conferido (é um banco íntegro do
  Brastem-Service? não é de uma versão mais nova do app?) e deixado pronto como `restauracao-pendente.sqlite`.
  O banco em uso **não** é trocado na hora: o app reinicia sozinho e a troca acontece na abertura.
- **R-BKP-07**: Nada se perde ao restaurar: o banco que estava em uso é guardado como
  `backups/antes-da-restauracao-*.sqlite` e pode ser restaurado de volta. A cópia fica completa num arquivo
  só: o que estava apenas no `-wal` (app fechado à força) é gravado nela antes de guardar.
- **R-BKP-08**: O que pode ser restaurado: backups do dia a dia (computador ou Drive) e as cópias automáticas
  `antes-da-restauracao-*` e `antes-da-migracao-*`. Só pelo nome do arquivo, nunca por caminho.
- **R-BKP-09**: Pastas criptografadas (EFS): em perfis em que o Windows não deixa renomear arquivos, o app
  copia e apaga em vez de renomear.
- **R-BKP-10**: Restaurar de um arquivo (só administrador): um backup guardado fora do app (pendrive, baixado
  do Drive) pode ser enviado pela tela: o `.sqlite.gz` dos backups ou o `.sqlite` das cópias automáticas (o
  formato é reconhecido pelo conteúdo, não pelo nome). Passa pelas mesmas conferências de R-BKP-06; arquivo
  recusado não deixa nada pendente.
- **R-BKP-11**: A conexão com o Google Drive sobrevive a atualizações e reinstalações: fica em
  `dados/integracoes/google.json`, que o instalador não toca (nem ao desinstalar). Só deixa de estar conectado
  ao clicar em _Desconectar_ ou se o Google revogar o acesso (aí o app avisa para conectar de novo).
- **R-BKP-12**: Começar do zero (só administrador, com a própria senha): um banco novo, vazio e na versão
  atual entra no lugar do atual pelo mesmo caminho da restauração (R-BKP-06, R-BKP-07). O app reabre no
  primeiro acesso (criar o administrador ou importar o sistema antigo, R-IMPT-01). Backups e a conexão com o
  Google Drive continuam. Senha errada responde 403 (não derruba a sessão); no máximo 5 tentativas por minuto.

## Onde está no código

- `apps/server/src/modules/backup/` (`backup.service.ts`, `backup.agendador.ts`, `restauracao.service.ts`,
  `google-oauth.service.ts`, `google-drive.client.ts`)
- `apps/server/src/common/database/connection.ts` (`aplicarRestauracaoPendente`)
- `apps/server/src/common/utils/arquivos.ts` (`moverArquivo`, R-BKP-09)

## Testes

- `apps/server/test/backup.e2e-spec.ts` — backup, retenção, Drive (com Google falso), envio pendente, restauração e recusas, restauração de arquivo enviado, conexão que continua depois de reabrir o app, começar do zero com senha (R-BKP-01 a R-BKP-08, R-BKP-10 a R-BKP-12).
- `apps/server/src/common/database/connection.spec.ts` — troca do banco na abertura, cópia antiga completa mesmo com `-wal` pendente (R-BKP-06, R-BKP-07).
- `apps/server/src/common/utils/arquivos.spec.ts` — R-BKP-09.
- `apps/server/src/modules/backup/backup.agendador.spec.ts` — 1 minuto depois de abrir e de hora em hora; falha não derruba o app (R-BKP-01).
