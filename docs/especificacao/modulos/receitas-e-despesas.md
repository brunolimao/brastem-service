# Receitas e despesas

> Dinheiro que entra ou sai fora de uma OS: venda de peça, gorjeta, transporte, compra de material...

**Prefixo das regras:** `R-TRA`

## Objetivo

Fazer o caixa refletir tudo o que entra e sai da loja, não só os serviços.

## Quem usa

Todos lançam receitas e despesas. Ver a lista e excluir é do administrador (pela tela de Caixa).

## Telas

- _**Lançar receita**_ e **_Lançar despesa_** (menu › Financeiro): formulário com o bloco de pagamentos.
  Depois de salvar, o administrador vai para o Caixa e o usuário comum para o Início.
- Os lançamentos aparecem no **_Caixa_**, de onde o administrador pode excluí-los.

## Campos

| Campo      | Obrigatório | Formato / limite                                                                    | Observação                                        |
| ---------- | ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| Descrição  | sim         | até 255                                                                             |                                                   |
| Valor      | sim (> 0)   | dinheiro                                                                            | sempre positivo; a despesa vira negativa no caixa |
| Data       | sim         | data                                                                                | padrão: hoje                                      |
| Categoria  | sim         | Receita: Venda, Gorjeta, Outros. Despesa: Transporte, Peça, Loja, Materiais, Outros |                                                   |
| Observação | não         | até 1000                                                                            |                                                   |
| Pagamentos | não         | ver [pagamentos-e-parcelas.md](pagamentos-e-parcelas.md)                            |                                                   |

## Regras

- **R-TRA-01**: sem pagamentos, o valor entra à vista, em dinheiro, na data do lançamento.
- **R-TRA-02**: com pagamentos, a soma deles precisa ser igual ao valor; senão o lançamento não é salvo e a
  tela mostra a diferença (o caixa soma os pagamentos, então os dois precisam bater).
- **R-TRA-03**: a categoria precisa ser uma das permitidas para o tipo (receita ou despesa).
- **R-TRA-04**: despesa entra negativa no caixa (R-PAG-04).
- **R-TRA-05**: excluir um lançamento (só administrador) apaga os pagamentos e parcelas dele.

## Permissões

| Ação                         | Administrador | Usuário comum |
| ---------------------------- | ------------- | ------------- |
| Lançar receita ou despesa    | sim           | sim           |
| Listar e excluir lançamentos | sim           | não           |

## API

| Método e rota                              | Para quê                                       | Quem pode     |
| ------------------------------------------ | ---------------------------------------------- | ------------- |
| `POST /api/transacoes`                     | lança receita ou despesa (R-TRA-01 a R-TRA-03) | logado        |
| `GET /api/transacoes?inicio&fim&tipo&page` | lista                                          | administrador |
| `DELETE /api/transacoes/:id`               | exclui com pagamentos (R-TRA-05)               | administrador |

## Onde está no código

- Server: `apps/server/src/modules/transacoes/`
- Client: `routes/_app/caixa/receita.tsx`, `routes/_app/caixa/despesa.tsx`, `components/domain/transacao-form.tsx`,
  `models/transacao.model.ts`

## Testes

- `apps/server/test/dominio.e2e-spec.ts` — despesa negativa no caixa (R-TRA-04).
- `apps/server/test/regras.e2e-spec.ts` — soma dos pagamentos (R-TRA-02).
- `apps/client/src/models/models.spec.ts` — categorias e soma dos pagamentos no formulário (R-TRA-02, R-TRA-03).

## Limitações conhecidas

- Não há edição de lançamento: para corrigir, exclua e lance de novo (como no sistema antigo, que nem excluía).
