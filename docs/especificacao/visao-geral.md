# Visão geral

## O que é

O Brastem-Service é o sistema de gestão de uma **assistência técnica de eletrodomésticos**. Ele controla:

- os **clientes**, seus telefones e **aparelhos** (geladeira, fogão, lava-louças...);
- as **ordens de serviço (OS)** de cada aparelho, do orçamento ao fechamento, com **garantia**;
- os **pagamentos** de cada OS (à vista ou parcelados) e os lançamentos avulsos de **receita e despesa**;
- o **caixa** do período e **relatórios** com indicadores e gráficos;
- os **usuários** do sistema;
- o **backup** dos dados, no computador e no Google Drive.

Ele substitui um sistema web antigo (Express + MySQL no Railway, front no Netlify). O que mudou está em
[historico/diferencas-do-sistema-antigo.md](historico/diferencas-do-sistema-antigo.md).

## Para quem

- **Administrador**: o dono ou gerente da loja. Faz tudo, inclusive caixa, relatórios, usuários,
  configurações e exclusões.
- **Usuário comum**: atendente ou técnico. Cadastra clientes, OS e lançamentos, mas não vê o financeiro
  consolidado nem exclui registros. Detalhes em [papeis-e-permissoes.md](papeis-e-permissoes.md).

## Como funciona (para quem não é técnico)

- É um **programa instalado no computador** (Windows). Não precisa de servidor nem de internet para o dia a dia.
- Os dados ficam **somente nesse computador**, num arquivo de banco de dados.
- Uma **cópia de segurança** é feita todo dia e, se o Google Drive estiver conectado, enviada para o Drive
  da própria loja.
- Quando sai uma **versão nova**, o programa baixa e avisa; ao reiniciar, ela é instalada.

## Princípios que valem para o sistema todo

1. **Tudo em português do Brasil**: telas, mensagens de erro e validações.
2. **Dinheiro sem arredondamento errado**: valores são guardados em centavos (inteiros); só a tela mostra
   "R$ 1.250,00". Digitar "1.250" vale mil duzentos e cinquenta reais.
3. **Datas sem surpresa de fuso**: datas de negócio (abertura, fechamento, parcelas) são só dia (`aaaa-mm-dd`);
   períodos de busca incluem as duas pontas.
4. **Nada se perde sem aviso**: exclusões que levam outros registros junto pedem confirmação e dizem o que
   vai junto; o banco tem backup automático antes de qualquer mudança de estrutura.
5. **Toda tabela é paginada** (20 linhas por página, com o total de resultados), pelo servidor nas listas
   que podem crescer e pela própria tabela nas pequenas.
6. **Erro é mensagem, não travamento**: dado inválido gera uma mensagem clara (erro 400), nunca uma falha
   genérica do servidor.
7. **Os dados são da loja**: nada é enviado ao desenvolvedor. Só o CEP vai ao ViaCEP (para preencher o endereço)
   e, se conectado, o backup vai ao Drive da própria loja. Ver [tecnico/seguranca-e-privacidade.md](tecnico/seguranca-e-privacidade.md).

## Arquitetura em uma frase

Um app **Electron** para Windows que roda dentro de si um servidor **NestJS** (escutando só em `127.0.0.1`)
com banco **SQLite**, e mostra o front em **React** numa janela. Código num monorepo (`apps/client`,
`apps/server`, `apps/desktop`, `packages/shared`). Convenções técnicas: [AGENTS.md](../../AGENTS.md).
