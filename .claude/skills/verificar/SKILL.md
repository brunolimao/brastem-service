---

name: verificar
description: Roda lint (Biome), typecheck, testes e build do monorepo e resume o que falhou. Use antes de concluir qualquer tarefa de código.
---

Na raiz, execute em ordem e pare no primeiro erro que impeça os seguintes:

1. `pnpm lint` (se houver problemas corrigíveis: `pnpm lint:fix` e rode de novo)
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

Reporte por etapa: passou/falhou, com arquivo:linha dos erros. Não declare a tarefa concluída com etapa falhando;
corrija a causa, não desligue regra do Biome nem pule teste.
