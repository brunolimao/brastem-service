CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expira_em` text NOT NULL,
	`revogado` integer DEFAULT false NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario` text NOT NULL,
	`senha_hash` text NOT NULL,
	`role` text DEFAULT 'usuario' NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_usuario_unique` ON `usuarios` (`usuario`);