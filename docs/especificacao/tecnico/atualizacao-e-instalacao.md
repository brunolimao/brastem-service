# Atualização e instalação

> Como o app chega ao computador da loja e como se mantém atualizado sem ninguém precisar fazer nada.

**Prefixo das regras:** `R-ATU`

## Instalação

- Instalador "um clique" para Windows (`Brastem-Service-Setup-x.y.z.exe`, baixado das
  [Releases](https://github.com/brunolimao/brastem-service/releases/latest)): instala direto em
  `%LOCALAPPDATA%\Programs\Brastem-Service`, só para o usuário (sem senha de administrador), com atalhos na
  Área de Trabalho e no Menu Iniciar, mostrando uma janela de progresso.
- O instalador não é assinado: o Windows mostra "editor desconhecido" (_Mais informações → Executar assim mesmo_).
- Desinstalar não apaga os dados (`%APPDATA%\Brastem-Service`).

## Regras

- **R-ATU-01**: Abertura: a janela abre na hora com "Iniciando o Brastem-Service…" e mostra o sistema quando o
  servidor interno fica pronto. Só uma janela por vez: abrir de novo traz a existente para a frente.
- **R-ATU-02**: Procura: o app procura versão nova ao abrir e a cada 4 horas, em silêncio; _Ajuda → Verificar
  atualizações_ (tecla Alt mostra o menu) procura na hora e responde com uma mensagem.
- **R-ATU-03**: Aviso de andamento: no canto da janela aparecem "Procurando atualizações…", "Baixando a
  atualização X (N%)…" e "Atualização X pronta para instalar", com o progresso também na barra de tarefas.
- **R-ATU-04**: Instalação: com a atualização baixada, o app pergunta _Reiniciar agora_ ou _Depois_. Reiniciar
  mostra "Instalando a atualização… o app vai fechar e reabrir sozinho", depois a janela de progresso do
  instalador, e reabre o app na versão nova. _Depois_ instala sozinho ao fechar o app.
- **R-ATU-05**: Integridade: o arquivo baixado é conferido pelo SHA-512 publicado junto (`latest.yml`); download
  corrompido é descartado.
- **R-ATU-06**: Versão que não inicia: o atualizador é ligado antes do servidor. Se o servidor não subir (ex.:
  defeito da versão), a tela de erro oferece _Procurar atualização_, que baixa e instala a correção; sem
  versão nova, oferece abrir a página de downloads.
- **R-ATU-07**: Sem internet ou GitHub fora do ar: o app funciona normalmente; tenta de novo depois.
- **R-ATU-08**: Pastas criptografadas (EFS): o download vai para a primeira pasta onde o Windows deixa renomear
  arquivos; nesses computadores a atualização baixa o instalador inteiro.
- **R-ATU-09**: Banco na atualização: a versão nova aplica as migrações do banco ao abrir, com backup antes (R-DAD-08).

## Publicação de uma versão (para o desenvolvedor)

1. Tudo verde no `main` (CI).
2. `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. O workflow _Release_ confere que a versão é válida e **maior** que a última publicada, roda lint, tipos,
   testes e build, gera o instalador (job só com leitura), e um segundo job publica a Release como rascunho
   com todos os arquivos e só então a torna pública. Se a publicação falhar, o rascunho é descartado e basta
   rodar de novo.
4. _Run workflow_ manual gera só o instalador de teste, sem publicar.

Como testar uma atualização sem publicar: ver "App desktop" no [AGENTS.md](../../../AGENTS.md).

## Onde está no código

- `apps/desktop/src/` (`main.ts`, `atualizador.ts`, `criar-atualizador.ts`, `cache-atualizacao.ts`, `aviso-atualizacao.ts`)
- `apps/desktop/electron-builder.yml`, `.github/workflows/release.yml`

## Testes

- `apps/desktop/src/atualizador.spec.ts` — procura, aviso de cada etapa, instalação ao aceitar (R-ATU-02 a R-ATU-04).
- `apps/desktop/src/aviso-atualizacao.spec.ts`, `cache-atualizacao.spec.ts`, `criar-atualizador.spec.ts` (R-ATU-03, R-ATU-08).
- `apps/server/test/inicio.e2e-spec.ts` — falha ao iniciar volta para o app, sem fechá-lo (R-ATU-06).
- Ciclo real (manual, com servidor local): 2.0.5 → 2.0.7 → 2.0.8 e 2.0.100 (sem iniciar) → 2.0.101, em 26/10/2026.
