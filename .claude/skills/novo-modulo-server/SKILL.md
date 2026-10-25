---

name: novo-modulo-server
description: Cria um módulo NestJS completo em apps/server (schema Drizzle, DTOs pt-BR, service, controller, testes). Use ao adicionar uma entidade/recurso de API.
---

Siga o AGENTS.md. Use como modelo `apps/server/src/modules/clientes/` (CRUD com busca paginada) e `ordens-servico/` (escrita multi-tabela em transação).

1. Schema em `common/database/schema/<modulo>.ts` (dinheiro em centavos, datas ISO) + migration (`drizzle-kit generate`).
2. `modules/<modulo>/` com module, controller, service, `dto/` (create/update/query).
3. DTOs: class-validator com mensagens em pt-BR; enums de `@brastem/shared`.
4. Controller: prefixo `/api`, `@ApiTags`/`@ApiOperation`, `@Roles` quando restrito a admin; paginação e busca com whitelist de campos.
5. Service: escritas multi-tabela em transação; erros com exceções Nest com mensagem pt-BR.
6. `<modulo>.service.spec.ts` cobrindo regra de negócio e casos de erro; e2e se mexer em auth/permissão.
7. Registrar no `app.module.ts` e rodar a skill `verificar`.
