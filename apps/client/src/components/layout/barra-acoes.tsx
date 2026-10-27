import type { ReactNode } from 'react'

/**
 * Ações dos formulários longos (Voltar / Salvar) numa barra flutuante no canto de baixo: acompanha a
 * rolagem sem cobrir a largura toda nem cortar os campos (R-UX-16).
 */
export function BarraAcoes({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-10 mt-2 flex justify-end print:hidden">
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-card/95 p-2 shadow-lg backdrop-blur">
        {children}
      </div>
    </div>
  )
}
