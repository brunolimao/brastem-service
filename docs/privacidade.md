# Política de Privacidade — Brastem-Service

Última atualização: 26/10/2026

O Brastem-Service é um aplicativo de computador para gestão de assistência técnica. Esta página explica,
de forma simples, o que ele faz com as informações.

## Onde ficam os dados

Todos os dados do sistema (clientes, ordens de serviço, pagamentos etc.) ficam **somente no computador de
quem usa o aplicativo**, em um arquivo local. O desenvolvedor do aplicativo **não recebe, não armazena e
não tem acesso** a esses dados.

## Integração opcional com o Google Drive

Se, e somente se, o usuário conectar o Google Drive em *Configurações*, o aplicativo:

- pede permissão para **criar e acessar apenas os arquivos que ele mesmo criou** (escopo `drive.file`) e para
  ler o **e-mail da conta** (escopo `userinfo.email`), usado apenas para mostrar qual conta está conectada;
- envia para uma pasta chamada **Brastem-Service Backups**, no Drive do próprio usuário, uma cópia compactada
  do banco de dados, como backup.

O aplicativo **não enxerga nenhum outro arquivo** do Drive. As chaves de acesso ficam guardadas apenas no
computador do usuário. Nenhuma informação é enviada ao desenvolvedor nem a terceiros.

O uso das informações recebidas das APIs do Google segue a
[Política de Dados do Usuário dos Serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy),
incluindo os requisitos de Uso Limitado.

## Como desconectar e apagar

Em *Configurações → Google Drive* o usuário pode desconectar a conta a qualquer momento. Os backups no Drive
podem ser apagados pelo próprio usuário, na pasta Brastem-Service Backups. O acesso também pode ser revogado em
<https://myaccount.google.com/permissions>.

## Contato

Dúvidas: abra uma issue em <https://github.com/brunolimao/brastem-service/issues>.
