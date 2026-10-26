# Glossário

| Termo                                       | Significado                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente**                                 | Pessoa ou empresa atendida. Tem telefones e aparelhos.                                                                                |
| **Cliente negativado**                      | Cliente marcado como mau pagador (com um motivo). Aparece em vermelho nas listas.                                                     |
| **Como conheceu** (_recomendação_)          | Como o cliente chegou à loja: _Cliente antigo_, _Indicação_, _Internet_, _Porta_ (passou na porta), _Outros_. Alimenta os relatórios. |
| **Aparelho**                                | Equipamento de um cliente (geladeira, fogão...). Tem marca, modelo, PNC e garantia.                                                   |
| **Código do aparelho** (_ordem_)            | Posição do aparelho na lista do cliente (Aparelho 1, 2, 3...). Renumerado ao salvar.                                                  |
| **PNC**                                     | Código do produto informado pelo fabricante, usado para pedir peças.                                                                  |
| **OS** (ordem de serviço)                   | Um atendimento de um aparelho: o que o cliente relatou, o que foi identificado, o valor e o resultado.                                |
| **Status da OS**                            | _Aberto_, _Aguardando_, _Aprovado_, _Fechado_ (serviço concluído) ou _Cancelado_.                                                     |
| **Taxa de deslocamento**                    | Valor cobrado pela visita, separado do valor do serviço.                                                                              |
| **Atendimento em garantia**                 | OS feita por conta de uma garantia anterior: não entra no valor faturado dos relatórios.                                              |
| **Garantia (dias)**                         | Prazo de garantia dado pelo serviço de uma OS fechada, contado a partir do fechamento.                                                |
| **Garantia do aparelho** (_garantia até_)   | Até quando o aparelho está na garantia do serviço: a maior entre as OS fechadas e o piso. Ver `R-GAR-*`.                              |
| **Piso de garantia** (_garantia importada_) | Garantia que veio do sistema antigo. O sistema novo nunca a reduz.                                                                    |
| **Pagamento**                               | Uma forma de pagamento usada numa OS ou num lançamento, com valor, data e quantidade de parcelas.                                     |
| **À vista**                                 | Pagamento com 0 parcelas: entra inteiro no caixa na data informada.                                                                   |
| **Parcela**                                 | Parte de um pagamento parcelado; a primeira vence um mês depois da data do pagamento.                                                 |
| **Receita / despesa** (_transação_)         | Lançamento avulso, fora de uma OS: venda de peça, gorjeta, transporte, compra de peça... Despesa entra negativa no caixa.             |
| **Caixa**                                   | Soma das parcelas (e pagamentos à vista) cuja data cai no período.                                                                    |
| **Período**                                 | Intervalo "De / Até" das telas de Caixa, Pagamentos e Relatórios. Inclui as duas datas. Padrão: mês atual.                            |
| **Administrador / usuário comum**           | Os dois papéis de acesso. Ver [papeis-e-permissoes.md](papeis-e-permissoes.md).                                                       |
| **Backup**                                  | Cópia compactada do banco (`brastem-aaaa-mm-dd-hhmmss.sqlite.gz`), no computador e no Drive.                                          |
| **Restauração**                             | Trocar os dados atuais por um backup. Acontece na próxima abertura do app.                                                            |
| **Migração (do banco)**                     | Mudança na estrutura do banco trazida por uma versão nova; aplicada sozinha ao abrir.                                                 |
| **Importação**                              | Trazer os dados do sistema antigo (arquivo `.sql` do MySQL) no primeiro uso.                                                          |
| **Sistema antigo**                          | O Brastem-Service anterior (web, Express + MySQL).                                                                                    |
| **Release**                                 | Uma versão publicada no GitHub, de onde o app instalado baixa as atualizações.                                                        |
