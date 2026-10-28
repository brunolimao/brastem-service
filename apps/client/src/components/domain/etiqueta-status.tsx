import type { StatusOS } from '@brastem/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/libs/utils'
import { ROTULO_STATUS } from '@/models/ordem-servico.model'

/**
 * Cada status na cor dele nos gráficos (`COR_DO_STATUS`), com fundo suave. A letra mistura a cor com a
 * do texto (escurece no tema claro, clareia no escuro) para continuar legível (R-UX-20). A mistura é em
 * oklab: em oklch o matiz passeava entre as duas cores e o âmbar saía verde. As classes ficam inteiras
 * aqui para o Tailwind encontrá-las.
 */
export const CLASSES_DO_STATUS: Record<StatusOS, string> = {
  ABERTO: 'bg-chart-1/15 text-[color-mix(in_oklab,var(--chart-1),var(--foreground)_45%)]',
  AGUARDANDO: 'bg-chart-4/20 text-[color-mix(in_oklab,var(--chart-4),var(--foreground)_50%)]',
  APROVADO: 'bg-chart-5/15 text-[color-mix(in_oklab,var(--chart-5),var(--foreground)_40%)]',
  FECHADO: 'bg-chart-3/15 text-[color-mix(in_oklab,var(--chart-3),var(--foreground)_45%)]',
  CANCELADO: 'bg-chart-2/15 text-[color-mix(in_oklab,var(--chart-2),var(--foreground)_40%)]',
}

export function EtiquetaStatus({ status }: { status: StatusOS }) {
  return (
    <Badge
      variant="outline"
      data-status-os={status}
      className={cn('border-transparent', CLASSES_DO_STATUS[status])}
    >
      {ROTULO_STATUS[status]}
    </Badge>
  )
}
