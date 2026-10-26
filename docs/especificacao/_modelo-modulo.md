# Nome do módulo

> Uma frase dizendo o que este módulo resolve para a loja.

**Prefixo das regras:** `R-XXX`

## Objetivo

Por que o módulo existe e qual problema do dia a dia ele resolve.

## Quem usa

Quais papéis usam e para quê (detalhe das permissões na seção própria).

## Telas

- _**Nome da tela**_ (menu › caminho): o que mostra e o que dá para fazer.

## Campos

| Campo | Obrigatório | Formato / limite | Observação |
| ----- | ----------- | ---------------- | ---------- |
| Nome  | sim         | texto, até 255   |            |

## Regras

- **R-XXX-01**: regra escrita de forma verificável (o que acontece, quando, com qual resultado).
- **R-XXX-02**: ...

## Permissões

| Ação | Administrador | Usuário comum |
| ---- | ------------- | ------------- |
| Ver  | sim           | sim           |

## API

| Método e rota  | Para quê | Quem pode |
| -------------- | -------- | --------- |
| `GET /api/...` | ...      | logado    |

## Onde está no código

- Server: `apps/server/src/modules/...`
- Client: `apps/client/src/...`

## Testes

- `caminho/do/teste` — o que ele garante (cite os códigos das regras).

## Limitações conhecidas

Comportamentos atuais que não são ideais, mas são assim de propósito ou ainda não foram tratados.
