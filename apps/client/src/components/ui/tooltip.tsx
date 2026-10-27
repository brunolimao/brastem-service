import { cn } from 'cn'
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import type * as React from 'react'

function TooltipProvider({
  delayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) animate-in items-center gap-2 text-balance rounded-md bg-foreground px-3 py-1.5 font-medium text-background text-xs shadow-md data-[state=closed]:animate-out',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/** "Salvar (Ctrl+S)" vira "Salvar" com o atalho numa etiqueta à parte. */
const COM_ATALHO = /^(.*\S)\s+\(((?:Ctrl|Alt|Shift)\+\S+|Esc)\)$/

function TextoDaDica({ texto }: { texto: string }) {
  const partes = COM_ATALHO.exec(texto)
  if (!partes) return texto
  return (
    <>
      {partes[1]}
      <kbd className="rounded border border-background/30 px-1.5 font-sans text-[0.7rem] text-background/80">
        {partes[2]}
      </kbd>
    </>
  )
}

/** Dica estilizada ao parar o mouse ou focar com o teclado (no lugar do `title` do navegador). */
function Dica({
  texto,
  lado,
  children,
}: {
  texto: string | undefined
  lado?: React.ComponentProps<typeof TooltipPrimitive.Content>['side']
  children: React.ReactElement
}) {
  if (!texto) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={lado}>
        <TextoDaDica texto={texto} />
      </TooltipContent>
    </Tooltip>
  )
}

export { Dica, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
