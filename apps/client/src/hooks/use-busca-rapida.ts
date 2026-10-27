import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { clientesService } from '@/services/clientes.service'
import { ordensServicoService } from '@/services/ordens-servico.service'

/** Quantos resultados de cada tipo a busca rápida mostra. */
export const MAXIMO_POR_TIPO = 5
/** A busca só começa com este tanto de letras (uma letra traria meio cadastro). */
export const MINIMO_DE_LETRAS = 2

interface BuscaRapidaState {
  aberta: boolean
  abrir: () => void
  fechar: () => void
}

/** Aberta pelo Ctrl+K, pelo botão do menu ou pelos atalhos do Início. */
export const useBuscaRapidaStore = create<BuscaRapidaState>((set) => ({
  aberta: false,
  abrir: () => set({ aberta: true }),
  fechar: () => set({ aberta: false }),
}))

/** O valor só muda depois de `espera` ms sem alteração (não consulta a cada tecla). */
export function useValorAtrasado<T>(valor: T, espera = 250) {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setAtrasado(valor), espera)
    return () => clearTimeout(temporizador)
  }, [valor, espera])
  return atrasado
}

/** Clientes (nome, telefone, CPF...) e OS (código, data, valor...) que batem com o texto. */
export function useBuscaRapida(texto: string) {
  const termo = texto.trim()
  return useQuery({
    queryKey: ['busca-rapida', termo],
    queryFn: async () => {
      const [clientes, ordens] = await Promise.all([
        clientesService.listar({ busca: termo }),
        ordensServicoService.listar({ busca: termo }),
      ])
      return {
        clientes: clientes.items.slice(0, MAXIMO_POR_TIPO),
        ordens: ordens.items.slice(0, MAXIMO_POR_TIPO),
      }
    },
    enabled: termo.length >= MINIMO_DE_LETRAS,
    staleTime: 10_000,
  })
}
