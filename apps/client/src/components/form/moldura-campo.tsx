import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/libs/utils'

interface MolduraCampoProps {
  id: string
  rotulo: string
  erro?: string
  className?: string
  children: ReactNode
}

/** Rótulo em cima, controle no meio e a mensagem de erro embaixo: o padrão de todos os campos. */
export function MolduraCampo({ id, rotulo, erro, className, children }: MolduraCampoProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  )
}

/** Atributos de acessibilidade do controle, ligando-o à mensagem de erro. */
export const ariaDoErro = (id: string, erro: string | undefined) => ({
  'aria-invalid': erro ? true : undefined,
  'aria-describedby': erro ? `${id}-erro` : undefined,
})
