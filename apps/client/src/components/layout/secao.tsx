import type { ReactNode } from 'react'
import { cn } from '@/libs/utils'

interface SecaoProps {
  titulo: string
  /** Quantos cartões lado a lado em tela larga (em tela estreita, sempre um embaixo do outro). */
  colunas?: 1 | 2
  children: ReactNode
}

/**
 * Grupo de cartões com um título pequeno (ex.: "Backup", "Neste computador" em Configurações). Dois cartões
 * por linha só em janela grande; em janela média ou estreita, um embaixo do outro.
 */
export function Secao({ titulo, colunas = 1, children }: SecaoProps) {
  const id = `secao-${titulo.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id} className="grid min-w-0 gap-3">
      <h2 id={id} className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        {titulo}
      </h2>
      <div
        className={cn(
          // Cartões da mesma linha com a mesma altura: blocos alinhados.
          'grid min-w-0 grid-cols-1 gap-4',
          colunas === 2 && 'lg:grid-cols-2',
        )}
      >
        {children}
      </div>
    </section>
  )
}
