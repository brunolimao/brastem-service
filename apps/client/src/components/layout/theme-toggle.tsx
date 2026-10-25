import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { temaEfetivo, useThemeStore } from '@/hooks/use-theme-store'

export function ThemeToggle() {
  const { tema, definirTema } = useThemeStore()
  const Icone = tema === 'sistema' ? Monitor : temaEfetivo(tema) === 'escuro' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alterar tema">
          <Icone />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => definirTema('claro')}>
          <Sun /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => definirTema('escuro')}>
          <Moon /> Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => definirTema('sistema')}>
          <Monitor /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
