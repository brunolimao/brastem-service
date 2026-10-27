import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  descricao?: string
  /** Botões de ação à direita (ex.: "Cadastrar"). */
  acoes?: ReactNode
}

export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-semibold text-2xl tracking-tight">{titulo}</h1>
        {descricao && <p className="text-muted-foreground text-sm">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}
