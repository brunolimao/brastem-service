# Decisões de projeto

> Por que o sistema é como é. Cada decisão tem contexto, escolha e consequência. Decisões novas entram no fim,
> com o próximo número; uma decisão revista ganha uma nova entrada que cita a anterior (a antiga não é apagada).

## D-01 · App desktop com banco local, em vez de servidor na nuvem

- **Contexto**: o sistema antigo dependia do Railway (pago) e do Netlify; uma loja, poucos usuários, um computador.
- **Escolha**: Electron com o servidor NestJS embutido e SQLite num arquivo local.
- **Consequência**: custo zero e funciona sem internet; o backup passa a ser responsabilidade do app (D-04).
  O Drizzle também suporta Postgres, se um dia for preciso um servidor central.

## D-02 · Dinheiro em centavos inteiros e um conversor único

- **Contexto**: o antigo guardava dinheiro como texto e somava com números quebrados ("116.66666666666667").
- **Escolha**: centavos inteiros no banco e na API; um conversor de texto compartilhado entre a tela e o
  servidor, no costume brasileiro ("1.250" = mil duzentos e cinquenta).
- **Consequência**: sem erro de arredondamento; a importação usa a regra antiga para ler os valores antigos (R-IMPT-03).

## D-03 · Sessão em cookies httpOnly com renovação rotativa

- **Escolha**: acesso de 15 min + renovação de 7 dias que muda a cada uso, com detecção de reuso.
- **Consequência**: o JavaScript da página não lê a sessão; um roubo de sessão derruba todas as sessões do usuário.

## D-04 · Backup diário local + Google Drive por API, sem SDK

- **Escolha**: cópia pela API de backup do SQLite, compactada; Drive com permissão só aos arquivos do app.
- **Consequência**: cada loja cria um app no Google Cloud (guia em `docs/backup-google-drive.md`) e o publica
  "em produção" para o acesso não expirar.

## D-05 · Restauração na próxima abertura

- **Contexto**: trocar o arquivo do banco com o servidor usando-o corromperia os dados.
- **Escolha**: preparar a troca e reiniciar; o banco antigo é guardado.
- **Consequência**: restaurar sempre reinicia o app.

## D-06 · Atualização automática pelas Releases públicas do GitHub

- **Escolha**: `electron-updater` lendo as Releases; repositório público (sem token nos clientes).
- **Consequência**: o repositório não pode ter dados da loja nem segredos (R-SEG-12); quem publica Release
  alcança todos os clientes (mitigações em R-SEG-15).

## D-07 · Instalador "um clique"

- **Contexto**: na atualização, o instalador silencioso deixava a tela vazia por segundos ou minutos (parecia travado).
- **Escolha**: instalador "um clique", que mostra uma janela de progresso, também nas atualizações; o app avisa antes de fechar.
- **Consequência**: não dá para escolher a pasta de instalação. O nome do pacote foi fixado (`Brastem-Service`)
  para o instalador usar a mesma pasta das versões anteriores.

## D-08 · Pastas criptografadas (EFS)

- **Contexto**: em alguns perfis o Windows recusa renomear arquivos dentro de `AppData` (erro EXDEV).
- **Escolha**: mover arquivos com fallback para copiar+apagar; cache da atualização na primeira pasta que aceite
  renomear (com adaptador próprio do electron-updater, versão fixa).
- **Consequência**: nesses computadores a atualização baixa o instalador inteiro.

## D-09 · Migração segura do banco

- **Contexto**: uma migração que recria tabela, com chaves estrangeiras ligadas, apagaria as OS em cascata.
- **Escolha**: backup antes, chaves desligadas durante, conferência no fim, recusa de banco de versão mais nova.
- **Consequência**: atualizações podem mudar a estrutura sem risco aos dados (R-DAD-08).

## D-10 · Garantia do aparelho recalculada, com piso

- **Contexto**: sobrescrever a garantia a cada OS deixava uma OS antiga encurtar a garantia de uma nova; e o
  sistema antigo zerava garantias escritas como texto.
- **Escolha**: garantia = maior entre as OS fechadas e o piso que veio do sistema antigo (R-GAR-02, R-GAR-03).
- **Consequência**: 1.711 aparelhos do sistema antigo passaram a ter a garantia que foi combinada com o cliente.

## D-11 · Servidor local fechado a outros sites

- **Contexto**: um site aberto no navegador conseguia criar o administrador num app recém-instalado (testado).
- **Escolha**: conferir `Host` e `Origin` e aceitar só JSON (R-SEG-02, R-SEG-03).

## D-12 · Formulários com `createFormHook`

- **Contexto**: o bloco de pagamentos, usado na OS e nos lançamentos, precisava de `any` para servir aos dois.
- **Escolha**: campos registrados num hook do TanStack Form e grupos reutilizáveis com `withFieldGroup`.
- **Consequência**: nomes de campos conferidos pelo TypeScript; um campo novo é registrado em `form-hook.ts`.

## D-13 · Especificação separada por assunto, com regras numeradas

- **Escolha**: `docs/especificacao/` com um arquivo por módulo e por tema técnico, todos no mesmo modelo,
  e regras com código (`R-XXX-NN`).
- **Consequência**: mudanças citam as regras; o padrão está na skill `especificacao`.

## D-14 · Toda tabela paginada, dentro do componente de tabela

- **Contexto**: Caixa e Usuários mostravam tudo de uma vez; com anos de dados, o Caixa ficaria enorme.
- **Escolha**: o `DataTable` sempre pagina: pelo servidor quando a tela passa `paginacao`; sozinho (20 por
  página) quando não passa. Listas que crescem (clientes, OS, pagamentos, caixa, usuários) paginam no servidor.
- **Consequência**: tabela nova já nasce paginada. No caixa, saldo e gráfico continuam do período inteiro (R-CX-05).

## D-15 · OS impressa em dois modelos

- **Contexto**: a loja e os clientes já conheciam a folha do sistema antigo.
- **Escolha**: manter o modelo novo como padrão e oferecer _Igual ao sistema antigo_, uma cópia da folha antiga
  (mesmas posições e fonte), escolhido por computador (R-IMP-03).
- **Consequência**: mudanças nos dados da OS precisam chegar aos dois modelos (`print-os.tsx` e
  `print-os-antigo.tsx`); o antigo só ganha o que existia lá.
