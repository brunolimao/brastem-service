ALTER TABLE `aparelhos` ADD `garantia_importada` text;
--> statement-breakpoint
-- Bancos que já existem: a garantia atual de cada aparelho vira o piso (nenhuma garantia diminui ao atualizar).
UPDATE `aparelhos` SET `garantia_importada` = `garantia_ate` WHERE `garantia_ate` IS NOT NULL;
--> statement-breakpoint
-- E já vale a regra nova (a mesma de recalcularGarantia): a maior entre o piso e as OS fechadas
-- (fechamento + dias). Corrige as garantias que o sistema antigo zerava ("90 DIAS" somava 0 dias).
UPDATE `aparelhos` SET `garantia_ate` = (
  SELECT MAX(`fim`) FROM (
    SELECT `aparelhos`.`garantia_importada` AS `fim`
    UNION ALL
    SELECT date(`os`.`fechamento`, '+' || `os`.`garantia_dias` || ' days')
    FROM `ordens_servico` `os`
    WHERE `os`.`aparelho_id` = `aparelhos`.`id`
      AND `os`.`status` = 'FECHADO'
      AND `os`.`fechamento` IS NOT NULL
      AND `os`.`garantia_dias` > 0
  )
);
