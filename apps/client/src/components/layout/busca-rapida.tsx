import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Search, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  MINIMO_DE_LETRAS,
  useBuscaRapida,
  useBuscaRapidaStore,
  useValorAtrasado,
} from '@/hooks/use-busca-rapida'
import { formatarData } from '@/libs/formatters'
import { mascararCpfCnpj } from '@/libs/masks'
import { ROTULO_STATUS } from '@/models/ordem-servico.model'

interface Resultado {
  chave: string
  tipo: 'cliente' | 'os'
  titulo: string
  detalhe: string
  ir: () => void
}

/** Ctrl+K (ou ⌘K) abre de qualquer tela. */
const ehAtalho = (evento: KeyboardEvent) =>
  (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k'

/**
 * Busca rápida: digita nome, telefone, CPF ou número da OS e vai direto, sem passar pelas listas.
 * O botão fica no menu; Ctrl+K abre de qualquer tela; setas escolhem e Enter abre.
 */
export function BuscaRapida() {
  const { aberta, abrir, fechar } = useBuscaRapidaStore()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [ativo, setAtivo] = useState(0)
  const termo = useValorAtrasado(texto)
  const { data, isFetching } = useBuscaRapida(termo)

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (!ehAtalho(evento)) return
      evento.preventDefault()
      abrir()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [abrir])

  const fecharELimpar = () => {
    fechar()
    setTexto('')
    setAtivo(0)
  }

  const resultados: Resultado[] = [
    ...(data?.clientes ?? []).map((cliente) => ({
      chave: `cliente-${cliente.id}`,
      tipo: 'cliente' as const,
      titulo: cliente.nome,
      detalhe: [`Código ${cliente.id}`, mascararCpfCnpj(cliente.cpf), cliente.email]
        .filter(Boolean)
        .join(' · '),
      ir: () => navigate({ to: '/clientes/$clienteId', params: { clienteId: String(cliente.id) } }),
    })),
    ...(data?.ordens ?? []).map((ordem) => ({
      chave: `os-${ordem.id}`,
      tipo: 'os' as const,
      titulo: `OS ${ordem.id} · ${ordem.clienteNome}`,
      detalhe: `${ordem.aparelhoNome} · ${ROTULO_STATUS[ordem.status]} · ${formatarData(ordem.abertura)}`,
      ir: () => navigate({ to: '/ordens-servico/$ordemId', params: { ordemId: String(ordem.id) } }),
    })),
  ]

  const escolher = (resultado: Resultado | undefined) => {
    if (!resultado) return
    resultado.ir()
    fecharELimpar()
  }

  const pronto = texto.trim().length >= MINIMO_DE_LETRAS && termo === texto && !isFetching

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent"
        onClick={abrir}
      >
        <Search /> Buscar
        <kbd className="ml-auto rounded border border-sidebar-border px-1.5 text-xs">Ctrl K</kbd>
      </Button>

      <Dialog open={aberta} onOpenChange={(valor) => (valor ? abrir() : fecharELimpar())}>
        <DialogContent className="top-[20%] translate-y-0 gap-3 p-4">
          <DialogTitle className="sr-only">Busca rápida</DialogTitle>
          <DialogDescription className="sr-only">
            Digite nome, telefone, CPF ou número da OS. Use as setas para escolher e Enter para
            abrir.
          </DialogDescription>
          <Input
            autoFocus
            aria-label="Buscar cliente ou OS"
            placeholder="Nome, telefone, CPF ou número da OS..."
            value={texto}
            role="combobox"
            aria-expanded={resultados.length > 0}
            aria-controls="busca-rapida-resultados"
            aria-activedescendant={resultados[ativo]?.chave}
            onChange={(evento) => {
              setTexto(evento.target.value)
              setAtivo(0)
            }}
            onKeyDown={(evento) => {
              if (evento.key === 'ArrowDown') {
                evento.preventDefault()
                setAtivo((atual) => Math.min(atual + 1, resultados.length - 1))
              } else if (evento.key === 'ArrowUp') {
                evento.preventDefault()
                setAtivo((atual) => Math.max(atual - 1, 0))
              } else if (evento.key === 'Enter') {
                evento.preventDefault()
                escolher(resultados[ativo])
              }
            }}
          />

          {texto.trim().length < MINIMO_DE_LETRAS ? (
            <p className="px-1 text-muted-foreground text-sm">
              Digite pelo menos {MINIMO_DE_LETRAS} letras ou números.
            </p>
          ) : pronto && resultados.length === 0 ? (
            <p className="px-1 text-muted-foreground text-sm">
              Nada encontrado para "{texto.trim()}".
            </p>
          ) : null}

          {resultados.length > 0 && (
            <div
              id="busca-rapida-resultados"
              role="listbox"
              aria-label="Resultados"
              className="grid max-h-80 gap-1 overflow-y-auto"
            >
              {resultados.map((resultado, indice) => {
                const Icone = resultado.tipo === 'cliente' ? UserRound : ClipboardList
                return (
                  <div
                    key={resultado.chave}
                    id={resultado.chave}
                    role="option"
                    tabIndex={-1}
                    aria-selected={indice === ativo}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-accent aria-selected:text-accent-foreground"
                    onMouseEnter={() => setAtivo(indice)}
                    onClick={() => escolher(resultado)}
                    onKeyDown={() => undefined}
                  >
                    <Icone className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{resultado.titulo}</p>
                      <p className="truncate text-muted-foreground text-xs">{resultado.detalhe}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
