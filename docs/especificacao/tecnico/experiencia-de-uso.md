# Experiência de uso

> Como o sistema facilita o dia a dia no balcão: atalhos, buscas, avisos e ajustes de leitura. Não muda
> nenhuma regra de negócio; só o caminho até ela.

**Prefixo das regras:** `R-UX`

## Regras

- **R-UX-01**: Busca rápida: o botão _Buscar_ no topo do menu, ou **Ctrl+K** de qualquer tela, abre uma busca por
  clientes (nome, telefone, CPF, e-mail...) e ordens de serviço (código, data, valor, status...). Mostra até 5
  de cada; as setas escolhem e **Enter** abre a ficha. Começa com 2 letras ou números e espera a digitação
  parar (0,25 s) para consultar.

## Onde está no código

- `apps/client/src/components/layout/busca-rapida.tsx`, `apps/client/src/hooks/use-busca-rapida.ts`

## Testes

- `apps/client/src/test/telas/busca-rapida.spec.tsx` — Ctrl+K, resultados, setas e Enter, mínimo de letras (R-UX-01).
