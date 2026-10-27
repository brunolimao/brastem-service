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
- **R-UX-05**: Tamanho da letra: **A−** e **A+** no rodapé do menu mudam o tamanho de todo o sistema (87,5% a 125%),
  guardado neste computador.
- **R-UX-06**: Ordenar: clicar no cabeçalho de uma coluna ordena a tabela (crescente → decrescente → ordem
  padrão), com seta indicando o sentido. Listas grandes ordenam no servidor (vale para todas as páginas, e a
  ordem fica na URL); só colunas de dado ordenam (não "Ações"). Texto em ordem do português (acentos e
  maiúsculas juntos, "Item 9" antes de "Item 10"); vazios sempre no fim.
- **R-UX-07**: Linhas por página: 10, 25 (padrão), 50 ou 100, no rodapé de toda tabela; a escolha vale para
  todas as tabelas e fica guardada neste computador. Mudar volta para a primeira página.

## Onde está no código

- `apps/client/src/components/layout/busca-rapida.tsx`, `apps/client/src/hooks/use-busca-rapida.ts`
- `apps/client/src/components/form/vigiar-alteracoes.tsx`, `apps/client/src/components/layout/aviso-sair-sem-salvar.tsx`, `apps/client/src/hooks/use-alteracoes-pendentes.ts`
- `apps/client/src/routes/_app/index.tsx`, `apps/client/src/hooks/use-recentes.ts`
- `apps/client/src/components/layout/app-sidebar.tsx`, `apps/client/src/hooks/use-preferencias-store.ts`
- `apps/client/src/components/data-table/data-table.tsx`, `apps/client/src/libs/ordenacao.ts`; no servidor, `ordenar` em `apps/server/src/common/utils/pagination.ts`

## Testes

- `apps/client/src/test/telas/busca-rapida.spec.tsx` — Ctrl+K, resultados, setas e Enter, mínimo de letras (R-UX-01).
- `apps/client/src/test/telas/sair-sem-salvar.spec.tsx` — pergunta, continuar editando, sair, desfazer à mão, depois de salvar (R-UX-02).
- `apps/client/src/test/telas/inicio.spec.tsx` — atalhos por papel, busca, fichas recentes por usuário (R-UX-03).
- `apps/client/src/components/layout/app-sidebar.spec.tsx` — menu recolhível, Ctrl+B, tamanho da letra e limites (R-UX-04, R-UX-05).
- `apps/client/src/components/data-table/data-table.spec.tsx`, `apps/client/src/test/telas/clientes.spec.tsx`, `apps/server/test/ordenacao.e2e-spec.ts` — ordenar na tela e no servidor, colunas permitidas, linhas por página (R-UX-06, R-UX-07).
