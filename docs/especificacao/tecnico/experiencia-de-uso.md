# Experiência de uso

> Como o sistema facilita o dia a dia no balcão: atalhos, buscas, avisos e ajustes de leitura. Não muda
> nenhuma regra de negócio; só o caminho até ela.

**Prefixo das regras:** `R-UX`

## Regras

- **R-UX-01**: Busca rápida: o botão _Buscar_ no topo do menu, ou **Ctrl+K** de qualquer tela, abre uma busca por
  clientes (nome, telefone, CPF, e-mail...) e ordens de serviço (código, data, valor, status...). Mostra até 5
  de cada; as setas escolhem e **Enter** abre a ficha. Começa com 2 letras ou números e espera a digitação
  parar (0,25 s) para consultar.
- **R-UX-02**: Sair sem salvar: ao trocar de tela (menu, _Voltar_, busca rápida) com alterações não salvas em
  cliente, OS, receita/despesa ou dados da empresa, o app pergunta _Continuar editando_ ou _Sair sem salvar_.
  "Alteração" é diferença em relação ao último salvo (desfazer à mão não conta); ir para outra tela durante o
  próprio salvamento não pergunta. Fechar o app não é bloqueado.
- **R-UX-03**: Início: atalhos (buscar, cadastrar cliente, ordens de serviço, lançar receita e despesa; caixa só
  para o administrador) e as últimas 8 fichas de cliente e de OS abertas, da mais nova para a mais antiga, sem
  repetir. Ficam guardadas neste computador, separadas por usuário.
- **R-UX-04**: Menu recolhível: o botão no topo do menu (ou **Ctrl+B**) deixa só os ícones, com o nome ao parar o
  mouse; a escolha fica guardada neste computador.
- **R-UX-05**: Tamanho da letra: em _Configurações → Aparência_ (Menor, Normal, Maior, Bem maior: 87,5% a 125%),
  vale para todo o sistema e fica guardado neste computador. Disponível para todos (R-CFG-09).
- **R-UX-06**: Ordenar: clicar no cabeçalho de uma coluna ordena a tabela (crescente → decrescente → ordem
  padrão), com seta indicando o sentido. Listas grandes ordenam no servidor (vale para todas as páginas, e a
  ordem fica na URL); só colunas de dado ordenam (não "Ações"). Texto em ordem do português (acentos e
  maiúsculas juntos, "Item 9" antes de "Item 10"); vazios sempre no fim.
- **R-UX-07**: Linhas por página: 10, 25 (padrão), 50 ou 100, no rodapé de toda tabela; a escolha vale para
  todas as tabelas e fica guardada neste computador. Mudar volta para a primeira página.
- **R-UX-08**: Atalhos nos formulários: **Ctrl+S** salva (com dois formulários na tela, o do cursor; com um
  diálogo aberto, só o do diálogo) e **Esc** volta (mas, com diálogo ou lista aberta, o Esc só fecha esse).
  Salvar com erro rola até o primeiro campo errado e põe o cursor nele.
- **R-UX-09**: Botões só com ícone (editar, excluir, imprimir, parcelas...) mostram o que fazem ao parar o mouse
  ou ao receber o foco do teclado, num balão do próprio sistema (componente `Dica`, nas cores do tema; o atalho,
  como _Ctrl+S_, sai numa etiqueta à parte), nunca na dica cinza do navegador (`title`). Vale também para o menu
  recolhido, a ordenação das tabelas e a legenda dos gráficos. Botão desabilitado que precisa explicar o porquê
  (excluir a si mesmo) leva a dica num invólucro focável.
- **R-UX-10**: Lista vazia sugere o próximo passo: _Cadastrar cliente_, _Limpar busca_ (quando a busca não achou
  nada), como gerar uma OS, _Lançar receita/despesa_ no caixa.
- **R-UX-11**: As listas (clientes, OS, pagamentos, caixa, usuários, relatórios) reabrem no ponto em que ficaram
  (busca, página, ordem, período) ao voltar pelo menu ou pelo _Voltar_ da ficha. Vale enquanto o app está aberto.
- **R-UX-12**: Início, de cima para baixo: o aviso de backup atrasado, se houver (R-BKP-14); atalhos; os números do dia e do mês (OS em andamento, abertas hoje,
  fechadas no mês, clientes novos no mês e, só para o administrador, faturamento e caixa do mês, com os mesmos
  cálculos de Relatórios e Caixa); o gráfico das OS em andamento por status; as 5 OS paradas há mais tempo
  (com os dias desde a abertura; data futura conta como hoje), com link para cada uma; as fichas recentes.
- **R-UX-13**: Janela estreita (ou letra grande) não corta nem empurra nada para fora da tela: o conteúdo encolhe
  até a largura da janela, títulos, ações e a barra de salvar quebram linha, o botão do cabeçalho de um cartão
  estreito desce para baixo do título e tabela larga rola dentro da própria moldura. Conferido a partir de
  560 px de janela com o menu aberto. Em tela grande o conteúdo aproveita a largura até 1536 px (a lista de OS
  cabe sem rolar num monitor Full HD); acima disso fica centralizado, para o texto não esticar demais.
- **R-UX-14**: No modo claro, nada se mistura com o fundo: campos têm fundo próprio, e botão contornado tem o
  fundo do cartão, borda mais forte que a das linhas e uma sombra leve. As cores vêm só dos tokens de
  `index.css` (trocar um token muda o sistema inteiro).
- **R-UX-15**: O fundo de hover (`--accent`: botões contornados e fantasmas, itens de menus e de listas) é um tom
  discreto da cor principal nos dois temas, nunca o destaque. O item ativo do menu tem fundo um pouco mais
  claro que o menu, contorno sutil, letra em negrito e uma marca na cor de destaque (`--sidebar-primary`) à
  esquerda. Os botões do menu (recolher, _Buscar_, tema) mantêm as cores do menu nos dois temas, também com o
  menu recolhido; _Sair_ fica vermelho ao passar o mouse.
- **R-UX-16**: Nos formulários longos (cliente, OS, receita/despesa), _Voltar_ e _Salvar_ ficam numa barra
  flutuante, compacta e arredondada, no canto de baixo à direita: acompanha a rolagem sem uma faixa de ponta a
  ponta cortando os campos. No fim do formulário ela fica embaixo do último cartão da página: na OS, os
  _Últimos serviços neste aparelho_ vêm antes dela (em página curta, que não rola, os botões ficavam no meio).
- **R-UX-17**: Tabelas compactas: cabeçalho em fundo cinza com letra pequena, linhas baixas, botões de ação
  pequenos e a paginação (quantidade, linhas por página, anterior/próxima) dentro do mesmo cartão da tabela,
  num rodapé com o mesmo fundo cinza do cabeçalho. Os cantos da tabela são menos arredondados (6 px) que os
  dos cartões (10 px).

- **R-UX-18**: Mensagem de erro de um campo só aparece depois que a pessoa digitou nele ou tentou salvar. Só
  passar pelo campo não conta: o _Nome_ começa com o cursor, e clicar em outro campo acusava "Informe o nome"
  antes de a pessoa chegar lá. Vale para todos os formulários.
- **R-UX-19**: Cores e letra: em _Configurações → Aparência_ há 8 paletas (Azul e tomate, a padrão; Petróleo e
  âmbar; Grafite e tomate; Índigo e coral; Verde-azulado e laranja; Azul royal e amarelo; Verde-floresta e
  terracota; Violeta e pêssego), cada uma com versão clara e escura, que trocam a cor principal, o hover e o
  menu. A escolha fica guardada neste computador e vale para todos os usuários dele. Toda paleta passa no
  contraste: texto dos botões e links 4,5:1 nos dois temas, letra do menu 4,5:1 e a marca do item ativo 3:1. A
  impressão da OS não muda de cor. A letra é a Inter, que vem com o app (funciona sem internet).
- **R-UX-20**: Status da OS em etiquetas coloridas, uma cor por status, as mesmas dos gráficos (Aberto azul,
  Aguardando âmbar, Aprovado roxo, Fechado verde, Cancelado vermelho), com fundo suave e a letra num tom mais
  forte da mesma cor. Os nomes das colunas das tabelas ficam em negrito.

## Onde está no código

- `apps/client/src/components/layout/busca-rapida.tsx`, `apps/client/src/hooks/use-busca-rapida.ts`
- `apps/client/src/components/form/vigiar-alteracoes.tsx`, `apps/client/src/components/layout/aviso-sair-sem-salvar.tsx`, `apps/client/src/hooks/use-alteracoes-pendentes.ts`
- `apps/client/src/routes/_app/index.tsx`, `apps/client/src/hooks/use-recentes.ts`, `apps/client/src/hooks/use-painel.ts`; no servidor, `apps/server/src/modules/painel/`
- `apps/client/src/components/layout/app-sidebar.tsx`, `apps/client/src/hooks/use-preferencias-store.ts`
- `apps/client/src/components/data-table/data-table.tsx`, `apps/client/src/libs/ordenacao.ts`; no servidor, `ordenar` em `apps/server/src/common/utils/pagination.ts`
- `apps/client/src/components/form/botao-salvar.tsx`, `apps/client/src/components/form/botao-voltar.tsx`, `apps/client/src/components/ui/button.tsx`
- `apps/client/src/hooks/use-listas-lembradas.ts` (lembrar listas), `acaoVazia` do `DataTable`
- `apps/client/src/components/form/form-errors.ts` (quando o erro aparece)
- `apps/client/src/libs/paletas.ts`, `apps/client/src/hooks/use-theme-store.ts`, `apps/client/src/components/domain/aparencia-card.tsx`, `apps/client/src/index.css`
- `apps/client/src/components/domain/etiqueta-status.tsx`, `apps/client/src/components/ui/table.tsx`

## Testes

- `apps/client/src/test/telas/busca-rapida.spec.tsx` — Ctrl+K, resultados, setas e Enter, mínimo de letras (R-UX-01).
- `apps/client/src/test/telas/sair-sem-salvar.spec.tsx` — pergunta, continuar editando, sair, desfazer à mão, depois de salvar (R-UX-02).
- `apps/client/src/test/telas/inicio.spec.tsx` — atalhos por papel, busca, fichas recentes por usuário (R-UX-03).
- `apps/client/src/components/layout/app-sidebar.spec.tsx` — menu recolhível e Ctrl+B (R-UX-04).
- `apps/client/src/components/domain/aparencia-card.spec.tsx` — tamanho da letra e limites (R-UX-05).
- `apps/client/src/components/data-table/data-table.spec.tsx`, `apps/client/src/test/telas/clientes.spec.tsx`, `apps/server/test/ordenacao.e2e-spec.ts` — ordenar na tela e no servidor, colunas permitidas, linhas por página (R-UX-06, R-UX-07).
- `apps/client/src/test/telas/atalhos.spec.tsx` — Ctrl+S, foco no erro, Esc, dois formulários na tela, dicas estilizadas (R-UX-08, R-UX-09).
- `apps/client/src/test/telas/administracao.spec.tsx` — dica do botão desabilitado de excluir a si mesmo (R-UX-09).
- `apps/client/src/test/telas/clientes.spec.tsx`, `apps/client/src/test/telas/financeiro.spec.tsx`, `apps/client/src/test/telas/ordens.spec.tsx` — lista vazia com ação, limpar busca, lista que reabre no mesmo ponto, inclusive ao voltar da OS (R-UX-10, R-UX-11).
- `apps/server/test/painel.e2e-spec.ts`, `apps/client/src/test/telas/inicio.spec.tsx` — resumo, gráfico, OS paradas, financeiro só para o administrador, ordem dos cartões (R-UX-12).
- `apps/client/src/libs/estilo.spec.ts` — largura máxima do conteúdo e classes que deixam o conteúdo encolher e quebrar linha (R-UX-13). O jsdom não mede layout: o efeito foi conferido no app a 560 px e 700 px, rota por rota.
- `apps/client/src/libs/estilo.spec.ts` — fundo dos campos e contraste do botão contornado (R-UX-14).
- `apps/client/src/libs/estilo.spec.ts` — hover discreto, item ativo do menu, Buscar recolhido e Sair (R-UX-15); barra de
  salvar flutuante e tabela compacta (R-UX-16, R-UX-17). A aparência é conferida pelas fotos de `visual/` (R-TST-08).
- `apps/client/src/components/domain/cliente-form.spec.tsx` — passar pelo Nome não acusa erro; salvar acusa (R-UX-18).
- `apps/client/src/libs/paletas.spec.ts`, `apps/client/src/components/domain/aparencia-card.spec.tsx` — 8 paletas,
  contraste de cada uma nos dois temas, troca na hora e versão escura (R-UX-19).
- `apps/client/src/libs/estilo.spec.ts` — letra Inter local, colunas em negrito e uma cor por status, a mesma
  dos gráficos (R-UX-19, R-UX-20).
