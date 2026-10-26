---

name: especificacao
description: Consulta e mantém a especificação em docs/especificacao (um arquivo por módulo e por tema técnico, regras numeradas R-XXX-NN). Use antes de mudar uma regra de negócio, tela, permissão, rota ou o banco, para saber o comportamento esperado, e depois, para atualizar a documentação no mesmo padrão.
---

A especificação diz **o que** o sistema faz e **por quê**; o `AGENTS.md` diz **como** o código é escrito.
Índice: `docs/especificacao/README.md`.

## Antes de mudar algo

1. Ache o arquivo do assunto no índice (módulo em `modulos/`, tema transversal em `tecnico/`, motivo em `historico/decisoes.md`).
2. Leia as regras (`R-XXX-NN`) afetadas e os testes listados no fim do arquivo: eles são a regra executável.
3. Se a mudança contraria uma regra, confirme com o usuário antes: pode ser comportamento de propósito.

## Depois de mudar (na mesma alteração)

1. Atualize o arquivo do módulo seguindo **exatamente** o modelo `docs/especificacao/_modelo-modulo.md`,
   nesta ordem de seções: título, resumo em citação (`>`), **Prefixo das regras**, Objetivo, Quem usa, Telas,
   Campos, Regras, Permissões, API, Onde está no código, Testes, Limitações conhecidas. Seção sem conteúdo é
   omitida, nunca reordenada.
2. **Regras**:
   - formato `- **R-PREFIXO-NN**: frase verificável` (o que acontece, quando, com qual resultado), em português de negócio;
   - regra nova recebe o **próximo número livre** do prefixo; nunca renumere nem reaproveite números;
   - regra que deixou de valer fica com **(removida em vX.Y.Z)** no início do texto, em vez de ser apagada;
   - regras de outros arquivos são citadas pelo código (ex.: "ver R-GAR-02").
3. **Prefixos em uso** (um por assunto; crie um novo só para um assunto novo e registre aqui):
   `R-PERM` permissões · `R-CLI` clientes · `R-TEL` telefones · `R-APA` aparelhos · `R-OS` ordens de serviço ·
   `R-GAR` garantia · `R-IMP` impressão · `R-PAG` pagamentos · `R-TRA` receitas e despesas · `R-CX` caixa ·
   `R-REL` relatórios · `R-ACE` acesso e sessão · `R-USU` usuários · `R-CFG` configurações ·
   `R-IMPT` importação · `R-DAD` dados e banco · `R-BKP` backup · `R-ATU` atualização · `R-SEG` segurança.
4. Tabelas de **Campos**: `Campo | Obrigatório | Formato / limite | Observação`, com os limites reais dos DTOs
   (`apps/server/src/modules/*/dto`). Tabelas de **Permissões**: `Ação | Administrador | Usuário comum`.
   Tabelas de **API**: `Método e rota | Para quê | Quem pode` (público / logado / administrador).
5. Rota nova ou com permissão diferente: atualize também `tecnico/api.md` e `papeis-e-permissoes.md`.
6. Migração nova: acrescente na tabela de `tecnico/dados-e-banco.md`.
7. Decisão de projeto (escolha entre alternativas, com consequência): nova entrada `D-NN` no fim de
   `historico/decisoes.md` (contexto, escolha, consequência); decisão revista ganha entrada nova que cita a antiga.
8. Diferença nova em relação ao sistema antigo: `historico/diferencas-do-sistema-antigo.md`.
9. Testes novos: cite os códigos das regras no nome ou num comentário do teste e liste o arquivo em **Testes**.

## Estilo

- Português do Brasil, frases curtas, nomes de tela em itálico como aparecem no menu (_Ordens de serviço_).
- Valores em reais na explicação ("R$ 1.250,00"); centavos só ao falar de API ou banco.
- Escreva o comportamento atual, verificado no código; o que não é ideal vai em **Limitações conhecidas**.
- Caminhos de código relativos à raiz do repositório, em `código`.

Ao terminar, rode a skill `verificar` (o Biome também confere a formatação dos `.md`).
