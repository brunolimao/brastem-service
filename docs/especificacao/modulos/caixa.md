# Caixa

> O que entrou e saiu da loja num período, parcela por parcela.

**Prefixo das regras:** `R-CX`

## Objetivo

Mostrar o saldo do período (dia, mês, ano ou datas escolhidas) e de onde veio cada valor.

## Quem usa

Só o administrador.

## Telas

- _**Caixa**_ (menu › Financeiro): filtro de período (De/Até e atalhos Hoje, Mês, Ano), total do período,
  gráfico de formas de pagamento e a lista de entradas e saídas em ordem de data. Cada linha mostra se veio
  de uma OS (com link) ou de um lançamento (descrição e categoria), a forma, "À vista" ou "n/N" e o valor
  (negativos em vermelho). Lançamentos avulsos podem ser excluídos daqui.

## Regras

- **R-CX-01**: o caixa é a lista das **parcelas** (incluindo as entradas à vista) cuja data cai no período.
- **R-CX-02**: o período inclui as duas datas. Sem datas na tela, vale o mês atual.
- **R-CX-03**: o total é a soma dos valores; despesas entram negativas, então o total é receitas menos despesas.
- **R-CX-04**: o gráfico conta quantas parcelas houve de cada forma de pagamento (quantidade, não valor),
  como no sistema antigo.
- **R-CX-05**: a lista vem paginada (20 por página), mas o saldo, a quantidade de movimentações e o gráfico
  valem sempre para o período inteiro, em qualquer página.

## Permissões

| Ação                      | Administrador | Usuário comum |
| ------------------------- | ------------- | ------------- |
| Ver o caixa               | sim           | não           |
| Excluir lançamento avulso | sim           | não           |

## API

| Método e rota                             | Para quê                                                                    | Quem pode     |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------- |
| `GET /api/caixa?inicio&fim&page&pageSize` | página de itens, total, quantidade e contagem por forma (R-CX-01 a R-CX-05) | administrador |

A API sem datas usa o dia de hoje; a tela sempre envia o período (mês atual por padrão).

## Onde está no código

- Server: `apps/server/src/modules/caixa/caixa.service.ts`
- Client: `routes/_app/caixa/index.tsx`, `components/domain/filtro-periodo.tsx`, `libs/periodo.ts`

## Testes

- `apps/server/test/dominio.e2e-spec.ts` — período inclusivo, despesa negativa e formas (R-CX-01 a R-CX-04).
- `apps/client/src/libs/periodo.spec.ts` — períodos padrão e atalhos (R-CX-02).

## Limitações conhecidas

- O gráfico conta parcelas, não soma valores, e mistura receitas e despesas.
