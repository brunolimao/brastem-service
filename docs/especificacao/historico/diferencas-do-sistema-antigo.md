# Diferenças em relação ao sistema antigo

> O que mudou ao trocar o sistema web antigo (Express + MySQL + React/Bootstrap) pelo app novo.
> Levantado comparando o código dos dois em 26/10/2026.

## Equivalente (mesma função, mesmo resultado)

- Clientes: busca pelos mesmos campos, colunas, negativado em vermelho, ViaCEP, telefones com contato, aparelhos.
- OS: mesmos campos e status, garantia empurrando a garantia do aparelho, lista por cliente e por aparelho.
- Pagamentos e parcelas: mesmas formas, parcelamento mensal com a primeira parcela um mês depois.
- Receitas e despesas: mesmas categorias, despesa negativa no caixa.
- Caixa: mesmo cálculo (parcelas do período) e o mesmo gráfico de formas de pagamento.
- Relatórios: mesmos indicadores e gráficos.
- Usuários: administrador e usuário comum, sem excluir a si mesmo.
- Impressão da OS: mesmos blocos (cliente, aparelho, serviço, últimos serviços).

## Melhorado

- Funciona sem internet e sem servidor pago; dados no computador da loja; instalador e atualização automática.
- Backup diário no computador e no Google Drive, com restauração pela tela (o antigo fazia um `mysqldump` sem tela).
- Senhas com argon2 (o antigo guardava em texto) e sessão em cookies protegidos.
- Dinheiro em centavos e datas como data (o antigo guardava quase tudo como texto).
- Impressão: dados da empresa configuráveis, todos os telefones, pagamentos da OS, assinaturas.
- Excluir cliente ou aparelho leva junto os pagamentos (o antigo deixava pagamentos órfãos somando no caixa).
- Listas de OS já abrem preenchidas (o antigo exigia clicar em Pesquisar).
- Pagamentos de receitas e despesas aparecem na tela de Pagamentos (o antigo escondia, mas somava).
- Exclusão de receitas e despesas pelo Caixa (o antigo não permitia).

## Defeitos do sistema antigo corrigidos

| Defeito                                                                               | Correção                                                                          |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| O filtro "até" não incluía o último dia                                               | Períodos incluem as duas pontas (R-DAD-04)                                        |
| "Relatado" e "identificado" não eram salvos ao editar a OS                            | Salvos sempre                                                                     |
| Rodapé da impressão usava um campo inexistente (`cliente.observacao`) e saía vazio    | Usa a referência do cliente (R-IMP-02)                                            |
| Garantia escrita como texto ("90 DIAS") somava 0 dias: o aparelho ficava sem garantia | A importação recalcula (R-IMPT-07); 1.711 aparelhos corrigidos no dump do Railway |
| Busca por telefone devolvia o telefone no lugar do cliente                            | Devolve o cliente                                                                 |
| Edição de pagamentos ignorada quando a OS não estava fechada nem tinha taxa           | Sempre gravada (R-OS-05)                                                          |
| Arredondamento das parcelas não fechava com o total                                   | Resto na última parcela (R-PAG-03)                                                |
| Rota "listar clientes" inacessível (conflito com a rota raiz)                         | Corrigido                                                                         |

## Diferente de propósito

- _Recomendação_ virou **Como conheceu**; "Passou na porta" virou **Porta**; categorias "Compra de peça" e
  "Gastos da loja" viraram **Peça** e **Loja**.
- Parcelas vão até 12x (o antigo ia até 6x); linha de pagamento sem valor é ignorada em vez de bloquear.
- _Gerar OS_ no cadastro de cliente novo: agora salva o cliente primeiro e o atalho aparece na edição.
- OS: "Fechado em" começa vazio e é obrigatório ao fechar (o antigo preenchia hoje); reabrir limpa
  fechamento, solução e garantia (como o antigo).
- Busca por código e por valor nas OS e nos pagamentos é exata (o antigo usava "contém").
- Pop-ups "ver cliente / ver aparelho" viraram links e colunas.
- Gráficos de cidades e bairros agrupam o resto em "Outros".
- Após salvar uma OS, volta para a lista do aparelho (o antigo voltava para a tela de origem).

## Não migrado

- Os arquivos `backup_*.sql` do próprio sistema antigo (formato diferente, só 4 tabelas, de antes da produção).
- Pagamentos órfãos (de OS ou clientes já excluídos no antigo): ignorados na importação, com aviso.
