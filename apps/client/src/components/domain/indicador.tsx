import { cn } from 'cn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface IndicadorProps {
  titulo: string
  valor: string
  detalhe?: string
  /** Valor em vermelho (ex.: saldo negativo). */
  negativo?: boolean
}

/** Número de destaque com título e uma linha de explicação (Início, Relatórios). */
export function Indicador({ titulo, valor, detalhe, negativo }: IndicadorProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn('text-3xl tracking-tight', negativo && 'text-destructive')}>
          {valor}
        </CardTitle>
      </CardHeader>
      {detalhe && <CardContent className="text-muted-foreground text-sm">{detalhe}</CardContent>}
    </Card>
  )
}
