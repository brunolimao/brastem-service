# Política de Privacidade — Brastem-Service

Última atualização: 26/10/2026

O Brastem-Service é um aplicativo de computador para gestão de assistência técnica. Esta página explica,
de forma simples, o que ele faz com as informações.

## Onde ficam os dados

Todos os dados do sistema (clientes, ordens de serviço, pagamentos etc.) ficam **somente no computador de
quem usa o aplicativo**, em um arquivo local. O desenvolvedor do aplicativo **não recebe, não armazena e
não tem acesso** a esses dados.

O botão _Gerar diagnóstico_ (em Configurações) só **salva um arquivo no computador**; nada é enviado
sozinho. O arquivo traz versões, a situação do banco e do backup, a quantidade de registros e os registros
técnicos (logs) dos últimos dias, sem dados de clientes, da empresa, senhas ou a conta do Google. Quem decide
se e para quem enviar é o administrador.

## Integração opcional com o Google Drive

Se, e somente se, o usuário conectar o Google Drive em _Configurações_, o aplicativo:

- pede permissão para **criar e acessar apenas os arquivos que ele mesmo criou** (escopo `drive.file`) e para
  ler o **e-mail da conta** (escopo `userinfo.email`), usado apenas para mostrar qual conta está conectada;
- envia para uma pasta chamada **Brastem-Service Backups**, no Drive do próprio usuário, uma cópia compactada
  do banco de dados, como backup.

O aplicativo **não enxerga nenhum outro arquivo** do Drive. As chaves de acesso ficam guardadas apenas no
computador do usuário. Os dados do Drive não são enviados ao desenvolvedor nem a terceiros.

## Outras conexões com a internet

Além do Google Drive (só se conectado), o aplicativo acessa a internet em dois casos:

- **Busca de endereço pelo CEP:** ao digitar um CEP no cadastro de cliente, só o CEP é enviado ao serviço
  público [ViaCEP](https://viacep.com.br), que devolve rua, bairro e cidade. Nenhum outro dado vai junto.
- **Atualizações:** ao abrir e a cada 4 horas, o aplicativo consulta a página de versões do projeto no
  GitHub para saber se há uma versão nova. Como em qualquer acesso a um site, o GitHub recebe o endereço
  IP do computador; nenhum dado do sistema é enviado.

O uso das informações recebidas das APIs do Google segue a
[Política de Dados do Usuário dos Serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy),
incluindo os requisitos de Uso Limitado.

## Como desconectar e apagar

Em _Configurações → Google Drive_ o usuário pode desconectar a conta a qualquer momento. Os backups no Drive
podem ser apagados pelo próprio usuário, na pasta Brastem-Service Backups. O acesso também pode ser revogado em
<https://myaccount.google.com/permissions>.

## Contato

Dúvidas: abra uma issue em <https://github.com/brunolimao/brastem-service/issues>.
