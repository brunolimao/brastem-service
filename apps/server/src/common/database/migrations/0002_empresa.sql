CREATE TABLE `empresa` (
	`id` integer PRIMARY KEY NOT NULL,
	`nome` text DEFAULT '' NOT NULL,
	`cnpj` text DEFAULT '' NOT NULL,
	`telefone` text DEFAULT '' NOT NULL,
	`endereco` text DEFAULT '' NOT NULL,
	`cep` text DEFAULT '' NOT NULL
);
