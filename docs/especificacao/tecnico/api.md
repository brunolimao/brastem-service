# API

> Todas as rotas do servidor interno, com quem pode usar. O detalhe de cada uma está no módulo.

Prefixo `/api`. Respostas e corpos em JSON; dinheiro em centavos; datas `aaaa-mm-dd`. Listagens devolvem
`{ items, total, page, pageSize }` (20 por página, máximo 100); o caixa devolve `{ itens, quantidade, page, pageSize }`
mais o saldo e as formas do período inteiro. Erros devolvem `{ statusCode, message }` com
mensagens em português. Com o app em desenvolvimento, a documentação interativa (Swagger) fica em
`http://localhost:3333/docs`.

**Quem pode:** _público_ (sem login), _logado_ (qualquer usuário) ou _admin_ (administrador).

| Método     | Rota                                    | Quem pode                        | Módulo                                                   |
| ---------- | --------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| GET        | `/auth/setup`                           | público                          | [acesso](../modulos/acesso-e-usuarios.md)                |
| POST       | `/auth/setup`                           | público, só sem usuários         | acesso                                                   |
| POST       | `/auth/login`                           | público                          | acesso                                                   |
| POST       | `/auth/refresh`                         | público (cookie)                 | acesso                                                   |
| POST       | `/auth/logout`                          | público (cookie)                 | acesso                                                   |
| GET        | `/auth/me`                              | logado                           | acesso                                                   |
| GET, POST  | `/usuarios`                             | admin                            | acesso                                                   |
| DELETE     | `/usuarios/:id`                         | admin                            | acesso                                                   |
| GET, POST  | `/clientes`                             | logado                           | [clientes](../modulos/clientes-e-aparelhos.md)           |
| GET, PATCH | `/clientes/:id`                         | logado                           | clientes                                                 |
| DELETE     | `/clientes/:id`                         | admin                            | clientes                                                 |
| GET, POST  | `/ordens-servico`                       | logado                           | [OS](../modulos/ordens-de-servico.md)                    |
| GET, PATCH | `/ordens-servico/:id`                   | logado                           | OS                                                       |
| DELETE     | `/ordens-servico/:id`                   | admin                            | OS                                                       |
| GET        | `/pagamentos`                           | admin                            | [pagamentos](../modulos/pagamentos-e-parcelas.md)        |
| GET        | `/pagamentos/:id/parcelas`              | admin                            | pagamentos                                               |
| POST       | `/transacoes`                           | logado                           | [receitas e despesas](../modulos/receitas-e-despesas.md) |
| GET        | `/transacoes`                           | admin                            | receitas e despesas                                      |
| DELETE     | `/transacoes/:id`                       | admin                            | receitas e despesas                                      |
| GET        | `/caixa`                                | admin                            | [caixa](../modulos/caixa.md)                             |
| GET        | `/relatorios`                           | admin                            | [relatórios](../modulos/relatorios.md)                   |
| GET        | `/empresa`                              | logado                           | [configurações](../modulos/configuracoes.md)             |
| PUT        | `/empresa`                              | admin                            | configurações                                            |
| GET        | `/backup/estado`, `/backup/arquivos`    | admin                            | configurações                                            |
| POST       | `/backup/executar`, `/backup/restaurar` | admin                            | configurações                                            |
| POST       | `/backup/google/credenciais`            | admin                            | configurações                                            |
| GET        | `/backup/google/conectar`               | admin                            | configurações                                            |
| DELETE     | `/backup/google`                        | admin                            | configurações                                            |
| GET        | `/backup/google/callback`               | público (protegido pelo `state`) | configurações                                            |
| POST       | `/import/legacy`                        | público, só sem usuários         | [importação](../modulos/importacao-do-sistema-antigo.md) |
| GET        | `/sistema`                              | público (versão do app)          | [acesso](../modulos/acesso-e-usuarios.md)                |

Restrições que valem para todas: R-SEG-02 (só pedidos locais) e R-SEG-03 (só JSON).
