# Papéis e permissões

> Quem pode fazer o quê. O servidor confere tudo; a tela só esconde o que o papel não pode usar.

**Prefixo das regras:** `R-PERM`

## Papéis

| Papel                         | Para quem          | Resumo                                                                                                    |
| ----------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Administrador** (`admin`)   | Dono ou gerente    | Faz tudo.                                                                                                 |
| **Usuário comum** (`usuario`) | Atendente, técnico | Cadastra e edita clientes, OS e lançamentos. Não vê o financeiro consolidado, não exclui e não configura. |

## Regras

- **R-PERM-01**: toda rota da API exige estar logado, exceto: primeiro acesso, login, renovação e saída da
  sessão, importação do sistema antigo (só antes do primeiro usuário), o retorno da autorização do Google e a
  versão do sistema.
- **R-PERM-02**: o papel vale como está **agora** no banco: se um usuário for excluído ou desativado, perde o
  acesso na hora, sem esperar a sessão vencer.
- **R-PERM-03**: as telas restritas redirecionam o usuário comum para o Início; o servidor responde 403 se
  alguém tentar a rota direto.
- **R-PERM-04**: ninguém exclui o próprio usuário.

## Tabela de permissões

| Ação                                                    | Administrador | Usuário comum                                  |
| ------------------------------------------------------- | ------------- | ---------------------------------------------- |
| Ver, cadastrar e editar clientes, telefones e aparelhos | sim           | sim                                            |
| Excluir cliente (e tudo dele)                           | sim           | não                                            |
| Ver, gerar e editar OS (com pagamentos), imprimir OS    | sim           | sim                                            |
| Excluir OS                                              | sim           | não                                            |
| Lançar receita ou despesa                               | sim           | sim                                            |
| Ver e excluir receitas/despesas (tela de Caixa)         | sim           | não                                            |
| Caixa                                                   | sim           | não                                            |
| Pagamentos (tela de consulta e parcelas)                | sim           | não                                            |
| Relatórios                                              | sim           | não                                            |
| Usuários (listar, cadastrar, excluir)                   | sim           | não                                            |
| Configurações: aparência (tamanho da letra)             | sim           | sim                                            |
| Configurações: ver/salvar dados da empresa              | sim           | não (a impressão da OS lê os dados para todos) |
| Configurações: backup, restauração e Google Drive       | sim           | não                                            |

## Onde está no código

- `apps/server/src/common/auth/` — `JwtAuthGuard` (sessão e usuário atual), `RolesGuard` (`@Roles('admin')`),
  `@Public()` para as rotas abertas.
- `apps/client/src/routes/_app/*.tsx` — `beforeLoad` das telas restritas; `app-sidebar.tsx` esconde os itens.

## Testes

- `apps/server/test/auth.e2e-spec.ts` — rotas exigem login; só admin gerencia usuários e ninguém apaga a si mesmo (R-PERM-01, R-PERM-04).
- `apps/server/test/dominio.e2e-spec.ts` — "usuário comum não acessa caixa, relatórios nem exclusões" (R-PERM-03).
- `apps/server/test/seguranca.e2e-spec.ts` — "usuário excluído perde o acesso na hora" (R-PERM-02).
- `apps/client/src/test/telas/acesso.spec.tsx` — usuário comum que abre o endereço de uma tela restrita volta ao Início (R-PERM-03).
- `apps/client/src/components/layout/app-sidebar.spec.tsx` — menu do usuário comum sem as telas restritas (R-PERM-03).
- `apps/server/test/transacoes.e2e-spec.ts` — usuário comum lança, mas não lista nem exclui lançamentos (R-PERM-03).
