import type { ReactNode } from 'react'

/** Barra fixa no rodapé dos formulários longos (Voltar / Salvar). */
export function BarraAcoes({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-8 mt-2 flex items-center justify-end gap-2 border-t bg-background/95 px-8 py-4 backdrop-blur print:hidden">
      {children}
    </div>
  )
}
