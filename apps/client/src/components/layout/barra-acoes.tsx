import type { ReactNode } from 'react'

/** Barra fixa no rodapé dos formulários longos (Voltar / Salvar). */
export function BarraAcoes({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8 print:hidden">
      {children}
    </div>
  )
}
