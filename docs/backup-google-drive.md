# Backup no Google Drive

O Brastem-Service guarda os dados num arquivo no computador do cliente. Para não perder tudo se o
computador quebrar, o sistema faz uma cópia todos os dias e, se o Google Drive estiver conectado,
envia essa cópia para lá.

## Como funciona

- **Quando:** o sistema confere de hora em hora se já passaram 24 horas do último backup. Se o computador
  ficou desligado na hora "certa", o backup sai na primeira vez que o sistema for aberto.
- **O quê:** uma cópia consistente do banco (feita pela API de backup do SQLite, sem travar quem está usando),
  compactada. Arquivos `brastem-AAAA-MM-DD-HHMMSS.sqlite.gz`.
- **Onde:** na pasta `backups` dentro da pasta de dados (guarda os 7 mais recentes) e, se conectado, na
  pasta **Brastem-Service Backups** do Google Drive (guarda os 30 mais recentes).
- **Sem internet:** o backup local sai normalmente e o envio fica pendente; é tentado de novo a cada hora.
- **Privacidade:** o app usa a permissão `drive.file`, que só enxerga os arquivos que ele mesmo criou.
  O resto do Drive do cliente é invisível para ele.

## Restaurar

`Configurações → Restaurar um backup → Restaurar` (só administrador). O sistema confere se o arquivo é um
banco íntegro do Brastem-Service, deixa-o preparado e reinicia. Na abertura seguinte o banco é trocado, e o
banco anterior **não é apagado**: fica em `backups/antes-da-restauracao-AAAA-MM-DD-HHMMSS.sqlite`.

## Criar o app no Google Cloud (uma vez só, é grátis)

O Google exige que quem acessa o Drive passe por um "app" cadastrado. Quem cuida do sistema (você) cria esse
app uma vez; depois é só colar duas chaves em `Configurações`.

1. Entre em <https://console.cloud.google.com> com a conta que vai ser a "dona" do app e crie um projeto
   (por exemplo, **Brastem-Service**).
2. **APIs e serviços → Biblioteca** → procure **Google Drive API** → **Ativar**.
3. **APIs e serviços → Tela de permissão OAuth** (ou **Google Auth Platform**):
   - Tipo de usuário: **Externo**.
   - Nome do app: `Brastem-Service`; e-mail de suporte: o seu.
   - Em **Escopos**, adicione `.../auth/drive.file` e `.../auth/userinfo.email`.
   - **Publique o app** (status **Em produção**). Isto é importante: no modo **Teste** o Google invalida o acesso
     a cada 7 dias e o backup para de subir. Como os dois escopos são não sensíveis, não precisa de verificação do Google.
4. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo de aplicativo: **App para computador** (Desktop app).
   - Copie o **ID do cliente** e a **Chave secreta do cliente**.
5. No Brastem-Service: `Configurações → Google Drive`, cole as duas chaves, **Salvar credenciais** e depois
   **Conectar ao Google Drive**. O navegador abre; escolha a conta e autorize. Quando aparecer
   "Google Drive conectado!", volte ao sistema.

> A "chave secreta" de apps para computador não é segredo de verdade (o próprio Google diz isso), mas
> também não a publique em lugar nenhum.

### Para quem instala em vários clientes

Em vez de digitar as chaves em cada instalação, defina as variáveis de ambiente `GOOGLE_CLIENT_ID` e
`GOOGLE_CLIENT_SECRET` do sistema. O que for digitado na tela tem prioridade sobre as variáveis.

## Onde ficam os arquivos

| O quê                      | Onde (no Windows)                                         |
| -------------------------- | --------------------------------------------------------- |
| Banco                      | `%APPDATA%\Brastem-Service\dados\brastem.sqlite`          |
| Backups locais             | `%APPDATA%\Brastem-Service\dados\backups\`                |
| Chaves e conexão do Google | `%APPDATA%\Brastem-Service\dados\integracoes\google.json` |

As chaves do Google ficam fora do banco de propósito, para não irem junto nos backups.
