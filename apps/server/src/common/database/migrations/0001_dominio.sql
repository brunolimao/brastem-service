CREATE TABLE `aparelhos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`ordem` integer DEFAULT 1 NOT NULL,
	`nome` text NOT NULL,
	`marca` text DEFAULT '' NOT NULL,
	`modelo` text DEFAULT '' NOT NULL,
	`pnc` text DEFAULT '' NOT NULL,
	`garantia_ate` text,
	`observacao` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`cpf` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`endereco` text DEFAULT '' NOT NULL,
	`numero` text DEFAULT '' NOT NULL,
	`complemento` text DEFAULT '' NOT NULL,
	`bairro` text DEFAULT '' NOT NULL,
	`cep` text DEFAULT '' NOT NULL,
	`uf` text DEFAULT '' NOT NULL,
	`cidade` text DEFAULT '' NOT NULL,
	`negativado` integer DEFAULT false NOT NULL,
	`motivo` text DEFAULT '' NOT NULL,
	`recomendacao` text DEFAULT 'antigo' NOT NULL,
	`referencia` text DEFAULT '' NOT NULL,
	`criado_em` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telefones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`nome` text DEFAULT '' NOT NULL,
	`telefone` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ordens_servico` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`aparelho_id` integer NOT NULL,
	`status` text DEFAULT 'ABERTO' NOT NULL,
	`valor` integer DEFAULT 0 NOT NULL,
	`taxa_deslocamento` integer DEFAULT 0 NOT NULL,
	`relatado` text DEFAULT '' NOT NULL,
	`identificado` text DEFAULT '' NOT NULL,
	`solucionado` text DEFAULT '' NOT NULL,
	`observacao` text DEFAULT '' NOT NULL,
	`garantia_dias` integer,
	`is_garantia` integer DEFAULT false NOT NULL,
	`abertura` text NOT NULL,
	`fechamento` text,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`aparelho_id`) REFERENCES `aparelhos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ordem_servico_id` integer,
	`transacao_id` integer,
	`tipo` text NOT NULL,
	`parcelas` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	`valor` integer NOT NULL,
	`observacao` text DEFAULT '' NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`ordem_servico_id`) REFERENCES `ordens_servico`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transacao_id`) REFERENCES `transacoes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parcelas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pagamento_id` integer NOT NULL,
	`numero` integer NOT NULL,
	`data` text NOT NULL,
	`valor` integer NOT NULL,
	FOREIGN KEY (`pagamento_id`) REFERENCES `pagamentos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`categoria` text NOT NULL,
	`data` text NOT NULL,
	`descricao` text NOT NULL,
	`observacao` text DEFAULT '' NOT NULL,
	`valor` integer NOT NULL,
	`criado_em` text NOT NULL
);
