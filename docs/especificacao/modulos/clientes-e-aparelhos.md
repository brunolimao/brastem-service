# Clientes e aparelhos

> Cadastro de quem a loja atende, como falar com cada cliente e quais aparelhos ele tem.

**Prefixo das regras:** `R-CLI` (cliente), `R-TEL` (telefones), `R-APA` (aparelhos)

## Objetivo

Ter num lugar só os dados de contato, o endereço e o histórico de cada aparelho do cliente, de onde
saem as ordens de serviço.

## Quem usa

Todos os usuários cadastram e editam. Só o administrador exclui um cliente.

## Telas

- _**Clientes**_ (menu › Clientes): lista com busca, 20 por página, do mais novo para o mais antigo.
  Colunas: código, nome, e-mail, CPF/CNPJ. Cliente negativado aparece em vermelho. Botões de editar e,
  para o administrador, excluir.
- _**Novo cliente**_ (Clientes › Novo): formulário com dados, endereço, telefones e aparelhos. Começa
  com um telefone e um aparelho em branco.
- _**Editar cliente**_ (clicar no cliente): o mesmo formulário, mais a _Data de cadastro_ e, em cada aparelho
  já salvo, os atalhos _Ver OS_ e _Gerar OS_. No topo, _Ver todas as OS_ do cliente.

## Campos

**Cliente**

| Campo                                 | Obrigatório | Formato / limite                                   | Observação                                               |
| ------------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------- |
| Nome                                  | sim         | até 255                                            |                                                          |
| CPF/CNPJ                              | não         | máscara automática, até 30                         |                                                          |
| E-mail                                | não         | e-mail válido                                      | vazio é aceito                                           |
| Como conheceu                         | não         | Cliente antigo, Indicação, Internet, Porta, Outros | padrão: Cliente antigo                                   |
| Cliente negativado                    | não         | sim/não                                            |                                                          |
| Motivo                                | não         | até 1000                                           | só aparece e só é guardado se negativado                 |
| Referência / observação               | não         | até 1000                                           | sai no rodapé da OS impressa                             |
| CEP                                   | não         | máscara, até 20                                    | com 8 dígitos, preenche o endereço (ViaCEP)              |
| Endereço, Complemento, Bairro, Cidade | não         | até 255                                            |                                                          |
| Número                                | não         | até 30                                             |                                                          |
| UF                                    | não         | 2 letras                                           |                                                          |
| Data de cadastro                      | —           | data                                               | só na edição; conta para "clientes novos" nos relatórios |

**Telefone** (vários por cliente)

| Campo           | Obrigatório | Formato / limite                  | Observação           |
| --------------- | ----------- | --------------------------------- | -------------------- |
| Nome do contato | não         | até 255                           | ex.: "Casa", "Filha" |
| Telefone        | sim         | máscara (fixo ou celular), até 30 |                      |

**Aparelho** (vários por cliente)

| Campo              | Obrigatório | Formato / limite      | Observação                                                 |
| ------------------ | ----------- | --------------------- | ---------------------------------------------------------- |
| Aparelho           | sim         | até 255               | ex.: Geladeira                                             |
| Marca, Modelo, PNC | não         | até 255               |                                                            |
| Observação         | não         | até 1000              |                                                            |
| Garantia até       | —           | data, somente leitura | calculada pelas OS (ver `R-GAR-*` em ordens-de-servico.md) |

## Regras

- **R-CLI-01**: a busca procura no campo escolhido; em _Todos os campos_ procura em código, nome, e-mail,
  CPF/CNPJ, endereço, CEP e telefones. A busca é por "contém". Em telefone, CPF/CNPJ e CEP, um texto que é só
  número (com ou sem pontuação) também é comparado só pelos dígitos: "31999991111" encontra "(31) 99999-1111" e
  "12345678901" encontra "123.456.789-01". Texto com letras ("Rua 7") busca como está.
- **R-CLI-02**: o CEP com 8 dígitos consulta o ViaCEP e preenche endereço, bairro, cidade e UF; se o CEP não
  existir, avisa e não apaga o que já estava digitado.
- **R-CLI-03**: o motivo só é guardado quando o cliente está marcado como negativado.
- **R-CLI-04**: a data de cadastro pode ser corrigida na edição (como no sistema antigo); é gravada ao
  meio-dia UTC para continuar no mesmo dia no horário de Brasília.
- **R-CLI-05**: excluir um cliente (só administrador) apaga junto telefones, aparelhos, OS, pagamentos e
  parcelas. A tela avisa antes.
- **R-CLI-06**: ao salvar a edição, as listas de telefones e aparelhos enviadas são a lista final: item com
  código existente é atualizado, item novo é criado, item que sumiu é excluído.
- **R-CLI-07**: os atalhos _Gerar OS_ e _Ver OS_ salvam antes o que foi alterado no formulário; se houver
  erro, ficam na tela mostrando o erro.
- **R-APA-01**: o código do aparelho é a posição dele na lista do cliente e é renumerado ao salvar.
- **R-APA-02**: remover um aparelho já salvo pede confirmação, porque ao salvar o cliente as OS, pagamentos
  e parcelas daquele aparelho também são excluídos. Aparelho ainda não salvo sai sem perguntar.
- **R-TEL-01**: cada linha de telefone precisa de um número; linhas vazias impedem salvar.

## Permissões

| Ação                                   | Administrador | Usuário comum |
| -------------------------------------- | ------------- | ------------- |
| Listar, buscar, ver, cadastrar, editar | sim           | sim           |
| Excluir cliente                        | sim           | não           |

## API

| Método e rota                                 | Para quê                                    | Quem pode     |
| --------------------------------------------- | ------------------------------------------- | ------------- |
| `GET /api/clientes?busca&campo&page&pageSize` | lista e busca (R-CLI-01)                    | logado        |
| `POST /api/clientes`                          | cadastra com telefones e aparelhos          | logado        |
| `GET /api/clientes/:id`                       | cliente com telefones e aparelhos           | logado        |
| `PATCH /api/clientes/:id`                     | edita (R-CLI-04, R-CLI-06)                  | logado        |
| `DELETE /api/clientes/:id`                    | exclui com tudo que depende dele (R-CLI-05) | administrador |

## Onde está no código

- Server: `apps/server/src/modules/clientes/` (service, DTOs com as validações)
- Client: `apps/client/src/routes/_app/clientes/`, `components/domain/cliente-form.tsx`,
  `models/cliente.model.ts`, `services/viacep.service.ts`

## Testes

- `apps/server/test/dominio.e2e-spec.ts` — cadastro, busca por telefone, edição das listas, exclusão em cascata (R-CLI-01, R-CLI-05, R-CLI-06).
- `apps/server/test/regras.e2e-spec.ts` — busca só pelos dígitos (R-CLI-01); data de cadastro corrigível e data inválida (R-CLI-04).
- `apps/server/src/common/utils/utils.spec.ts` — o que conta como "texto que é só número" (R-CLI-01).
- `apps/client/src/components/domain/cliente-form.spec.tsx` — confirmação ao remover aparelho e atalhos que salvam antes (R-APA-02, R-CLI-07).
- `apps/client/src/components/domain/busca-lista.spec.tsx` — busca em _Todos_ por padrão e caixa acompanhando a URL.
- `apps/client/src/hooks/hooks.spec.tsx` — salvar cliente recarrega OS, caixa e relatórios (R-APA-02).

## Limitações conhecidas

- A busca por código é "contém" (buscar "1" também traz 10, 21...), diferente das OS, onde é exata.
