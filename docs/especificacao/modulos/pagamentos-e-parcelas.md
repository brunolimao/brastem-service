# Pagamentos e parcelas

> Como o cliente pagou uma OS (ou como foi pago um lançamento) e quando cada parte entra no caixa.

**Prefixo das regras:** `R-PAG`

## Objetivo

Registrar a forma de pagamento e dividir compras parceladas em parcelas mensais, que é o que o caixa soma.

## Quem usa

Todos lançam pagamentos dentro de uma OS ou de uma receita/despesa. A tela de consulta _Pagamentos_ é só
do administrador.

## Telas

- **Bloco _Pagamentos_** (dentro da OS e do lançamento de receita/despesa): uma linha por pagamento, com
  _Adicionar pagamento_ e lixeira em cada linha.
- _**Pagamentos**_ (menu, administrador): todos os pagamentos do período (OS e lançamentos), com filtro de
  forma de pagamento, busca e o botão que mostra as parcelas de cada um.

## Campos

| Campo      | Obrigatório | Formato / limite                                                             | Observação                                       |
| ---------- | ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| Valor      | sim (> 0)   | dinheiro                                                                     | linha com valor vazio ou zero é ignorada         |
| Forma      | sim         | Dinheiro, Débito, Crédito, Pix, Pix parcelado, Cheque, Boleto, Transferência |                                                  |
| Parcelas   | sim         | À vista (0) ou de 1x a 12x                                                   |                                                  |
| Data       | sim         | data                                                                         | data do pagamento à vista ou da compra parcelada |
| Observação | não         | até 255                                                                      |                                                  |

## Regras

- **R-PAG-01**: à vista (0 parcelas) gera uma única entrada no caixa, na data informada.
- **R-PAG-02**: parcelado em N vezes gera N parcelas mensais; a **primeira vence um mês depois** da data
  informada, a segunda dois meses depois, e assim por diante.
- **R-PAG-03**: o valor é dividido em centavos inteiros; o que sobrar da divisão vai para a **última** parcela
  (R$ 100,00 em 3x = 33,33 + 33,33 + 33,34). A soma das parcelas é sempre igual ao valor.
- **R-PAG-04**: pagamentos de despesas são gravados com valor negativo (saem do caixa).
- **R-PAG-05**: pagamentos e parcelas são sempre gravados na mesma transação da OS ou do lançamento.
- **R-PAG-06**: na tela _Pagamentos_, sem datas escolhidas vale o **mês atual** (o mesmo período que o
  filtro mostra). A busca _Todos_ procura em código (exato), valor, forma e observação. A busca por valor
  ignora o sinal (acha despesas também).
- **R-PAG-07**: os valores aceitam "1.250", "1.250,50", "150,5" e "150.50" (ver R-DAD-01 em tecnico/dados-e-banco.md).

## Permissões

| Ação                                        | Administrador | Usuário comum |
| ------------------------------------------- | ------------- | ------------- |
| Lançar pagamentos numa OS ou num lançamento | sim           | sim           |
| Tela _Pagamentos_ e consulta de parcelas    | sim           | não           |

## API

| Método e rota                                          | Para quê                 | Quem pode     |
| ------------------------------------------------------ | ------------------------ | ------------- |
| `GET /api/pagamentos?inicio&fim&tipo&busca&campo&page` | consulta (R-PAG-06)      | administrador |
| `GET /api/pagamentos/:id/parcelas`                     | parcelas de um pagamento | administrador |

Os pagamentos são criados e substituídos pelas rotas da OS e das transações (campo `pagamentos`).

## Onde está no código

- Server: `apps/server/src/modules/pagamentos/` (`pagamentos.service.ts`: `criar`, parcelamento),
  `common/utils/money.ts` (`dividirEmParcelas`)
- Client: `components/domain/pagamentos-campos.tsx` (grupo de campos reutilizado), `routes/_app/pagamentos.tsx`,
  `models/pagamento.model.ts`

## Testes

- `apps/server/test/dominio.e2e-spec.ts` — parcelamento numa OS, despesa negativa (R-PAG-02 a R-PAG-04).
- `apps/server/src/common/utils/utils.spec.ts` — divisão em parcelas (R-PAG-03).
- `apps/server/test/regras.e2e-spec.ts` — busca _Todos_ filtra pelo texto.
- `apps/client/src/libs/periodo.spec.ts` — sem datas na URL vale o mês atual (R-PAG-06).
- `apps/server/src/modules/ordens-servico/ordens-servico.service.spec.ts` — pagamentos que falham desfazem a OS ou o lançamento (R-PAG-05).
- `packages/shared/src/dinheiro.spec.ts` — leitura de valores (R-PAG-07).

## Limitações conhecidas

- Editar uma OS recria os pagamentos dela: os códigos dos pagamentos mudam a cada edição.
- A tela _Pagamentos_ lista do mais novo (código) para o mais antigo, não por data.
