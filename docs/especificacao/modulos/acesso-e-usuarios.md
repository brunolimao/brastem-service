# Acesso e usuários

> Como se entra no sistema, quanto tempo a sessão dura e quem cadastra os usuários.

**Prefixo das regras:** `R-ACE` (acesso e sessão), `R-USU` (usuários)

## Objetivo

Garantir que só pessoas cadastradas usem o sistema, cada uma com o seu papel.

## Quem usa

Todos fazem login. Só o administrador cadastra e exclui usuários.

## Telas

- _**Primeiro acesso**_: aparece só quando ainda não existe nenhum usuário. Cria o administrador ou leva à
  importação do sistema antigo.
- _**Login**_: usuário e senha.
- _**Usuários**_ (menu › Administração): lista paginada (código, usuário, função, data de cadastro), cadastrar e excluir.
- Rodapé do menu: nome e função de quem está logado, a versão do app ("Versão 2.1.0"; "Desenvolvimento" fora
  do app instalado), troca de tema (claro/escuro) e _Sair_.

## Campos

| Campo   | Obrigatório | Formato / limite       | Observação                          |
| ------- | ----------- | ---------------------- | ----------------------------------- |
| Usuário | sim         | 3 a 50 caracteres      | único no sistema                    |
| Senha   | sim         | 8 a 100 caracteres     | "Repita a senha" no primeiro acesso |
| Função  | sim         | Administrador, Usuário |                                     |

## Regras

- **R-ACE-01**: o primeiro acesso só funciona com o banco sem usuários; dois pedidos ao mesmo tempo criam um
  único administrador (o outro recebe erro).
- **R-ACE-02**: usuário ou senha errados respondem sempre a mesma mensagem e no mesmo tempo, sem revelar
  se o usuário existe.
- **R-ACE-03**: no máximo 5 tentativas de login (e de primeiro acesso) por minuto.
- **R-ACE-04**: a sessão usa dois cookies protegidos: o de acesso vale 15 minutos e é renovado sozinho pelo de
  renovação, que vale 7 dias e muda a cada uso. Reapresentar um de renovação já usado derruba todas as sessões
  daquele usuário (sinal de roubo).
- **R-ACE-05**: _Sair_ invalida a sessão no servidor.
- **R-ACE-06**: quando a sessão não pode ser renovada, o app volta ao login e, depois de entrar, retorna à tela
  em que estava.
- **R-USU-01**: não podem existir dois usuários com o mesmo nome (cadastro simultâneo também é barrado).
- **R-USU-02**: ninguém exclui o próprio usuário.
- **R-USU-03**: senhas são guardadas com argon2 (nunca em texto); as do sistema antigo são convertidas na importação.
- **R-USU-04**: usuário excluído perde o acesso na hora (R-PERM-02).

## Permissões

| Ação                                 | Administrador | Usuário comum |
| ------------------------------------ | ------------- | ------------- |
| Login, sair, ver os próprios dados   | sim           | sim           |
| Listar, cadastrar e excluir usuários | sim           | não           |

## API

| Método e rota                                                                       | Para quê                                        | Quem pode                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------ |
| `GET /api/auth/setup`                                                               | informa se falta criar o primeiro administrador | público                  |
| `POST /api/auth/setup`                                                              | cria o primeiro administrador (R-ACE-01)        | público, só sem usuários |
| `POST /api/auth/login`                                                              | entra (R-ACE-02, R-ACE-03)                      | público                  |
| `POST /api/auth/refresh`                                                            | renova a sessão (R-ACE-04)                      | público (cookie)         |
| `POST /api/auth/logout`                                                             | sai (R-ACE-05)                                  | público (cookie)         |
| `GET /api/auth/me`                                                                  | dados de quem está logado                       | logado                   |
| `GET /api/usuarios?page&pageSize`, `POST /api/usuarios`, `DELETE /api/usuarios/:id` | usuários (R-USU-*)                              | administrador            |

## Onde está no código

- Server: `apps/server/src/modules/auth/`, `modules/usuarios/`, `common/auth/`
- Client: `routes/login.tsx`, `routes/primeiro-acesso.tsx`, `routes/_app/usuarios.tsx`,
  `hooks/use-session-store.ts`, `services/api.ts` (renovação automática)

## Testes

- `apps/server/test/auth.e2e-spec.ts` — primeiro acesso uma vez só, credenciais inválidas, login/renovação/saída, reuso detectado, ninguém apaga a si mesmo (R-ACE-01, R-ACE-02, R-ACE-04, R-ACE-05, R-USU-02).
- `apps/server/test/limites.e2e-spec.ts` — 6ª tentativa de login no minuto recusada (R-ACE-03).
- `apps/server/test/regras.e2e-spec.ts` — primeiro acesso e cadastros simultâneos (R-ACE-01, R-USU-01).
- `apps/server/test/seguranca.e2e-spec.ts` — usuário excluído perde o acesso (R-USU-04).
- `apps/client/src/services/api.spec.ts` — renovação automática e sessão expirada (R-ACE-06).
- `apps/client/src/hooks/hooks.spec.tsx` — _Sair_ limpa a sessão mesmo sem resposta do servidor (R-ACE-05).
- `apps/client/src/libs/query-client.spec.ts` — erros viram aviso; sessão expirada não avisa duas vezes (R-ACE-06).
- `apps/client/src/components/domain/usuario-e-empresa.spec.tsx` — cadastro de usuário (validação e função padrão).

## Limitações conhecidas

- Não há troca de senha nem de função: para mudar, exclua e cadastre de novo (como no sistema antigo).
