---

name: nova-tela-client
description: Cria uma tela no apps/client (rota TanStack, model Zod, service, hooks, tabela e formulário). Use ao adicionar uma página ou fluxo de CRUD no front.
---

Siga o AGENTS.md. Modelos: lista paginada com busca em `routes/_app/clientes/index.tsx`; formulário com listas dinâmicas em `components/domain/cliente-form.tsx` (e `ordem-servico-form.tsx` para dinheiro, datas e pagamentos); CRUD simples em dialog: a tela de usuários: `routes/_app/usuarios.tsx`, `components/domain/criar-usuario-dialog.tsx`, `hooks/use-usuarios.ts`, `services/usuarios.service.ts` e `models/usuario.model.ts`.

1. `models/<x>.model.ts`: tipos + schemas Zod (mensagens pt-BR), derivando enums de `@brastem/shared`.
2. `services/<x>.service.ts`: chamadas via `services/api.ts` (sem tratar toast aqui).
3. `hooks/use-<x>.ts`: `useQuery`/`useMutation` do TanStack Query; invalidar queries relacionadas; toast de sucesso nas mutations.
4. Rota em `routes/_app/<x>/` (file-based); filtros e paginação em search params validados por Zod, não em `location.state`.
5. Listagem com `components/data-table`; formulário com TanStack Form + `components/form`; dinheiro/data/máscaras via `libs/`.
6. Teste (Vitest + Testing Library) do que tiver regra; depois rodar a skill `verificar`.
