# Especificação do Brastem-Service

O que o sistema faz, por que e com quais regras. Serve para consulta: quem vai mudar algo (pessoa ou
IA) começa pelo arquivo do assunto, confere as regras e só depois vai ao código.

## Como está organizada

| Pasta / arquivo                                                                        | Para que serve                                                                               |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [visao-geral.md](visao-geral.md)                                                       | O que é o sistema, para quem, princípios que valem para tudo                                 |
| [glossario.md](glossario.md)                                                           | Termos do negócio e do sistema (OS, parcela, piso de garantia...)                            |
| [papeis-e-permissoes.md](papeis-e-permissoes.md)                                       | O que o administrador e o usuário comum podem fazer                                          |
| **modulos/**                                                                           | Uma página por área do sistema: telas, campos, regras, permissões, API e onde está no código |
| [modulos/clientes-e-aparelhos.md](modulos/clientes-e-aparelhos.md)                     | Cadastro de clientes, telefones e aparelhos                                                  |
| [modulos/ordens-de-servico.md](modulos/ordens-de-servico.md)                           | OS, status, garantia e impressão                                                             |
| [modulos/pagamentos-e-parcelas.md](modulos/pagamentos-e-parcelas.md)                   | Formas de pagamento, parcelamento e a tela de Pagamentos                                     |
| [modulos/receitas-e-despesas.md](modulos/receitas-e-despesas.md)                       | Lançamentos avulsos (venda de peça, transporte...)                                           |
| [modulos/caixa.md](modulos/caixa.md)                                                   | Entradas e saídas do período                                                                 |
| [modulos/relatorios.md](modulos/relatorios.md)                                         | Indicadores e gráficos                                                                       |
| [modulos/acesso-e-usuarios.md](modulos/acesso-e-usuarios.md)                           | Primeiro acesso, login, sessão e cadastro de usuários                                        |
| [modulos/configuracoes.md](modulos/configuracoes.md)                                   | Dados da empresa, backup e Google Drive (a tela)                                             |
| [modulos/importacao-do-sistema-antigo.md](modulos/importacao-do-sistema-antigo.md)     | Migração dos dados do sistema antigo                                                         |
| **tecnico/**                                                                           | Requisitos que não são de uma tela: dados, backup, atualização, segurança, API               |
| [tecnico/dados-e-banco.md](tecnico/dados-e-banco.md)                                   | Dinheiro, datas, fuso, migrações, o que é apagado junto                                      |
| [tecnico/backup-e-restauracao.md](tecnico/backup-e-restauracao.md)                     | Quando e como os backups são feitos e restaurados                                            |
| [tecnico/atualizacao-e-instalacao.md](tecnico/atualizacao-e-instalacao.md)             | Instalador, atualização automática e publicação de versões                                   |
| [tecnico/seguranca-e-privacidade.md](tecnico/seguranca-e-privacidade.md)               | Proteções do app, da sessão e dos dados                                                      |
| [tecnico/api.md](tecnico/api.md)                                                       | Todas as rotas da API, com permissão                                                         |
| **historico/**                                                                         | Por que as coisas são como são                                                               |
| [historico/diferencas-do-sistema-antigo.md](historico/diferencas-do-sistema-antigo.md) | O que mudou em relação ao sistema antigo e os defeitos corrigidos                            |
| [historico/decisoes.md](historico/decisoes.md)                                         | Decisões de projeto e o motivo de cada uma                                                   |

## Convenções deste documento

- **Regras numeradas**: cada regra de negócio tem um código (`R-OS-03`, `R-GAR-01`...). Cite o código
  em conversas, commits e testes, para ficar fácil achar o porquê de um comportamento.
- **Telas** aparecem como no menu do app (ex.: _Ordens de serviço_, _Configurações_).
- **Dinheiro** é sempre em reais na tela e em **centavos** na API e no banco (ver `tecnico/dados-e-banco.md`).
- Cada módulo termina com **Onde está no código** e **Testes**: são o ponto de partida para mudanças.

## Mantendo atualizada

Mudou uma regra, uma tela ou uma permissão? Atualize o arquivo do módulo na mesma alteração (o `AGENTS.md`
pede isso). Uma regra nova ganha o próximo número livre do módulo; uma regra removida fica marcada como
**(removida em vX.Y)** em vez de sumir, para os números antigos continuarem valendo como referência.
