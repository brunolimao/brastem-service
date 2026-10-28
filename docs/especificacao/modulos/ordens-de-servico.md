# Ordens de serviço

> O atendimento de um aparelho, do relato do cliente ao fechamento, com pagamentos, garantia e impressão.

**Prefixo das regras:** `R-OS` (ordem de serviço), `R-GAR` (garantia), `R-IMP` (impressão)

## Objetivo

Registrar cada serviço: o que o cliente relatou, o que o técnico identificou, quanto custou, como foi pago
e por quanto tempo o serviço tem garantia. A OS impressa é o documento entregue ao cliente.

## Quem usa

Todos os usuários geram, editam e imprimem OS. Só o administrador exclui.

## Telas

- _**Ordens de serviço**_ (menu): lista com busca, 20 por página. Pode vir filtrada por cliente ou por aparelho
  (atalhos _Ver OS_ / _Ver todas as OS_). Colunas: código, abertura, cliente, aparelho, status, valor (valor +
  taxa), problema solucionado. Imprimir, editar e, para o administrador, excluir.
- _**Nova OS**_ (atalho _Gerar OS_ no aparelho do cliente): formulário com o resumo do cliente e do aparelho.
- _**Editar OS**_: o mesmo formulário, o botão _Imprimir_ e a lista dos últimos serviços do aparelho.
- _**Imprimir OS**_: página pronta para impressão (abre a impressão do Windows), com a escolha do modelo:
  _Modelo novo_ ou _Igual ao sistema antigo_ (R-IMP-03).

## Campos

| Campo                           | Obrigatório     | Formato / limite                                         | Observação                                                           |
| ------------------------------- | --------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| Data de abertura                | sim             | data                                                     | padrão: hoje                                                         |
| Status                          | sim             | Aberto, Aguardando, Aprovado, Fechado, Cancelado         | padrão: Aberto                                                       |
| Valor                           | não             | dinheiro                                                 | vazio = R$ 0,00                                                      |
| Taxa de deslocamento            | não             | dinheiro                                                 |                                                                      |
| Atendimento em garantia         | não             | sim/não                                                  | não entra no faturamento (R-OS-07)                                   |
| Problema relatado, identificado | não             | até 2000                                                 |                                                                      |
| Observação                      | não             | até 2000                                                 |                                                                      |
| Problema solucionado            | não             | até 2000                                                 | só com status Fechado                                                |
| Fechado em                      | sim, se Fechado | data                                                     | só com status Fechado                                                |
| Garantia (dias)                 | não             | número inteiro ≥ 0                                       | só com status Fechado                                                |
| Pagamentos                      | não             | ver [pagamentos-e-parcelas.md](pagamentos-e-parcelas.md) | seção aparece com status Fechado, taxa > 0 ou pagamentos já lançados |

## Regras

- **R-OS-01**: a OS pertence a um cliente e a um aparelho **desse** cliente; outro aparelho é recusado.
- **R-OS-02**: OS com status Fechado precisa da data de fechamento.
- **R-OS-03**: fora do status Fechado não há fechamento, solução nem garantia: mudar uma OS fechada para
  outro status (reabrir) limpa esses três campos, como fazia o sistema antigo.
- **R-OS-04**: esvaziar "Fechado em" ou "Garantia (dias)" na edição limpa o campo de verdade (não mantém o antigo).
- **R-OS-05**: ao salvar uma OS com pagamentos, os pagamentos enviados substituem todos os anteriores dela
  (com as parcelas), tudo numa única transação: ou grava tudo, ou nada.
- **R-OS-06**: busca: _Todos_ procura em código (exato), data de abertura, valor, status e problema solucionado;
  um campo específico procura só nele. Abertura aceita `25/10/2026`, `10/2026` ou `2026-10`. Valor encontra
  tanto o valor do serviço quanto valor + taxa, e aceita "1.250" ou "1.250,00".
- **R-OS-07**: OS marcada como atendimento em garantia não conta no valor faturado dos relatórios.
- **R-OS-08**: o botão _Imprimir_ da edição salva antes o que foi alterado (a impressão sai com o que está na tela).
- **R-OS-09**: excluir a OS (só administrador) apaga os pagamentos e parcelas dela e recalcula a garantia do aparelho.
- **R-GAR-01**: a garantia de uma OS fechada vai até a data de fechamento + os dias de garantia.
- **R-GAR-02**: a garantia do aparelho é a **maior** entre as garantias das OS fechadas dele e o piso
  (R-GAR-03). É recalculada sempre que uma OS do aparelho é criada, editada ou excluída. Assim, editar uma OS
  antiga não encurta a garantia dada por uma mais nova, e apagar a garantia de uma OS vale de verdade.
- **R-GAR-03**: a garantia que veio do sistema antigo é um **piso**: o recálculo nunca fica abaixo dela.
- **R-GAR-04**: aparelho sem OS fechada com garantia e sem piso fica sem garantia.
- **R-IMP-01**: o cabeçalho mostra os dados da empresa preenchidos em Configurações; o que não foi preenchido
  não aparece. Sem nada preenchido, mostra só "Brastem-Service".
- **R-IMP-02**: a impressão traz: número da OS; cliente (código, nome, CPF/CNPJ, e-mail, telefones, endereço
  completo, referência); aparelho (código, nome, marca, modelo, PNC, garantia até, observação); serviço
  (abertura, status, valor, taxa, fechamento, solução, garantia em dias, relatado, identificado, observação);
  pagamentos (forma, parcelas, data, valor); até 5 serviços do mesmo aparelho além da OS impressa, do mais novo
  para o mais antigo (abertura, fechamento,
  solução, garantia, valor e deslocamento separados); linhas de assinatura do cliente e do técnico. A edição
  da OS mostra os mesmos 5 serviços anteriores; a API devolve as 6 OS mais novas do aparelho (`ultimasOrdens`).
- **R-IMP-03**: o modelo _Igual ao sistema antigo_ reproduz a folha do antigo: as mesmas posições, tamanhos,
  rótulos e fonte (2480 × 3508 px reduzidos para a largura do A4, sem margem de página); valores sem "R$",
  status como gravado (ex.: `FECHADO`) e "Últimos 5 serviços" contando a OS impressa. Só muda a origem dos
  dados da empresa (Configurações, R-IMP-01) e o campo _Referência/Observação_, que no antigo saía sempre vazio
  e aqui traz a referência. A escolha do modelo vale para o computador (preferência guardada) e pode ser
  trocada na página de impressão ou em Configurações › Impressão da OS; o padrão é o modelo novo.
- **R-IMP-04**: o papel sai sempre branco, mesmo com o tema escuro e "gráficos de fundo" ligado na impressão
  (antes a margem saía preta). O modelo novo tem margem de 12 mm; o igual ao antigo não tem margem de página e
  usa a margem da própria folha antiga (cerca de 7 mm), como lá.

## Permissões

| Ação                                 | Administrador | Usuário comum |
| ------------------------------------ | ------------- | ------------- |
| Listar, ver, gerar, editar, imprimir | sim           | sim           |
| Excluir                              | sim           | não           |

## API

| Método e rota                                                   | Para quê                                                     | Quem pode     |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ------------- |
| `GET /api/ordens-servico?busca&campo&clienteId&aparelhoId&page` | lista e busca (R-OS-06)                                      | logado        |
| `POST /api/ordens-servico`                                      | gera a OS com pagamentos (R-OS-01, R-OS-02, R-GAR-02)        | logado        |
| `GET /api/ordens-servico/:id`                                   | OS com cliente, aparelho, telefones, pagamentos e últimas OS | logado        |
| `PATCH /api/ordens-servico/:id`                                 | edita; `null` limpa fechamento/garantia (R-OS-03 a R-OS-05)  | logado        |
| `DELETE /api/ordens-servico/:id`                                | exclui (R-OS-09)                                             | administrador |

## Onde está no código

- Server: `apps/server/src/modules/ordens-servico/` (`ordens-servico.service.ts`, `garantia.ts` com a regra R-GAR)
- Client: `apps/client/src/routes/_app/ordens-servico/`, `components/domain/ordem-servico-form.tsx`,
  `components/domain/print-os.tsx`, `print-os-antigo.tsx`, `seletor-modelo-impressao.tsx`,
  `models/ordem-servico.model.ts`

## Testes

- `apps/server/src/modules/ordens-servico/garantia.spec.ts` — R-GAR-01 a R-GAR-04.
- `apps/server/test/regras.e2e-spec.ts` — busca _Todos_ e por data, reabrir, limpar garantia, exclusão recalcula garantia, OS em garantia fora do faturado do relatório (R-OS-03, R-OS-04, R-OS-06, R-OS-07, R-OS-09, R-GAR-02).
- `apps/server/test/dominio.e2e-spec.ts` — OS fechada com parcelas, regras da OS, edição substituindo pagamentos (R-OS-01, R-OS-02, R-OS-05).
- `apps/client/src/components/domain/print-os.spec.tsx` — conteúdo da impressão e os 5 serviços anteriores (R-IMP-01, R-IMP-02).
- `apps/client/src/components/domain/print-os-antigo.spec.tsx` — folha igual à do antigo (R-IMP-03).
- `apps/client/src/test/telas/ordens.spec.tsx` — troca de modelo na página de impressão (R-IMP-03).
- `apps/client/src/libs/estilo.spec.ts` — papel branco na impressão (R-IMP-04).
- `apps/server/test/regras.e2e-spec.ts` — a OS traz as 6 últimas do aparelho (R-IMP-02).
- `apps/client/src/components/domain/ordem-servico-form.spec.tsx` — campos que aparecem por status, fechamento obrigatório, pagamentos, _Imprimir_ salvando antes (R-OS-02, R-OS-08).

## Limitações conhecidas

- Os pop-ups "ver cliente / ver aparelho" do sistema antigo viraram links e a coluna do aparelho na lista.
- _Voltar_ e _Salvar_ da edição levam à lista de OS como ela estava (busca, página, ordem, R-UX-11); se a lista
  de OS ainda não foi aberta nesta sessão, à lista de OS do aparelho. O antigo voltava para a tela de origem
  (ex.: a ficha do cliente).
