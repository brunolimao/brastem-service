CREATE INDEX `aparelhos_cliente_id_idx` ON `aparelhos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `telefones_cliente_id_idx` ON `telefones` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `ordens_servico_cliente_id_idx` ON `ordens_servico` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `ordens_servico_aparelho_id_idx` ON `ordens_servico` (`aparelho_id`);--> statement-breakpoint
CREATE INDEX `ordens_servico_abertura_idx` ON `ordens_servico` (`abertura`);--> statement-breakpoint
CREATE INDEX `pagamentos_ordem_servico_id_idx` ON `pagamentos` (`ordem_servico_id`);--> statement-breakpoint
CREATE INDEX `pagamentos_transacao_id_idx` ON `pagamentos` (`transacao_id`);--> statement-breakpoint
CREATE INDEX `pagamentos_data_idx` ON `pagamentos` (`data`);--> statement-breakpoint
CREATE INDEX `parcelas_pagamento_id_idx` ON `parcelas` (`pagamento_id`);--> statement-breakpoint
CREATE INDEX `parcelas_data_idx` ON `parcelas` (`data`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_usuario_id_idx` ON `refresh_tokens` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `transacoes_data_idx` ON `transacoes` (`data`);