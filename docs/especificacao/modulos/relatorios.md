# Relatórios

> Indicadores do período: quanto a loja faturou, quantas OS, quantos clientes novos e de onde vieram.

**Prefixo das regras:** `R-REL`

## Objetivo

Acompanhar o desempenho da loja e de onde vêm os clientes, para decisões do dono.

## Quem usa

Só o administrador.

## Telas

- _**Relatórios**_ (menu › Financeiro): filtro de período e:
  - indicadores: valor fechado / valor total, OS em garantia / total de OS (com %), clientes novos;
  - gráficos de pizza: status das OS, como conheceram (pelas OS), como conheceram (clientes novos),
    cidades e bairros dos clientes novos.

## Regras

- **R-REL-01**: as OS do período são as com **data de abertura** no período (inclusivo).
- **R-REL-02**: valor total = soma de valor + taxa de deslocamento das OS do período que **não** são
  atendimento em garantia; valor fechado = o mesmo, só das OS com status Fechado.
- **R-REL-03**: OS em garantia = quantidade de OS marcadas como atendimento em garantia.
- **R-REL-04**: clientes novos = clientes com **data de cadastro** no período, contada no horário local da
  loja (um cadastro às 22h do dia 31 ainda conta no dia 31).
- **R-REL-05**: os gráficos de cidades e bairros mostram as 6 maiores fatias e juntam o resto em "Outros",
  sem perder nada do total.
- **R-REL-06**: sem datas na tela vale o mês atual; o período inclui as duas pontas.

## Permissões

| Ação           | Administrador | Usuário comum |
| -------------- | ------------- | ------------- |
| Ver relatórios | sim           | não           |

## API

| Método e rota                    | Para quê                                          | Quem pode     |
| -------------------------------- | ------------------------------------------------- | ------------- |
| `GET /api/relatorios?inicio&fim` | indicadores e distribuições (R-REL-01 a R-REL-04) | administrador |

## Onde está no código

- Server: `apps/server/src/modules/relatorios/relatorios.service.ts`
- Client: `routes/_app/relatorios.tsx`, `components/charts/` (`opcao-pizza.ts`: `agruparMenores`)

## Testes

- `apps/server/test/dominio.e2e-spec.ts` — "relatório consolida OS e clientes novos" (R-REL-01 a R-REL-04).
- `apps/client/src/components/charts/grafico-pizza.spec.tsx` — agrupamento em "Outros" (R-REL-05).

## Limitações conhecidas

- O horário local (R-REL-04) é o do computador onde o app roda; ele precisa estar no fuso certo.
