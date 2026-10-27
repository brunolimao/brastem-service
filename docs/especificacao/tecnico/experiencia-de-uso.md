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

## Onde está no código

- `apps/client/src/components/layout/busca-rapida.tsx`, `apps/client/src/hooks/use-busca-rapida.ts`
- `apps/client/src/components/form/vigiar-alteracoes.tsx`, `apps/client/src/components/layout/aviso-sair-sem-salvar.tsx`, `apps/client/src/hooks/use-alteracoes-pendentes.ts`
- `apps/client/src/routes/_app/index.tsx`, `apps/client/src/hooks/use-recentes.ts`
- `apps/client/src/components/layout/app-sidebar.tsx`, `apps/client/src/hooks/use-preferencias-store.ts`

## Testes

- `apps/client/src/test/telas/busca-rapida.spec.tsx` — Ctrl+K, resultados, setas e Enter, mínimo de letras (R-UX-01).
- `apps/client/src/test/telas/sair-sem-salvar.spec.tsx` — pergunta, continuar editando, sair, desfazer à mão, depois de salvar (R-UX-02).
- `apps/client/src/test/telas/inicio.spec.tsx` — atalhos por papel, busca, fichas recentes por usuário (R-UX-03).
- `apps/client/src/components/layout/app-sidebar.spec.tsx` — menu recolhível, Ctrl+B, tamanho da letra e limites (R-UX-04, R-UX-05).
