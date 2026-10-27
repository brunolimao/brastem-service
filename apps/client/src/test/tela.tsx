import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { configure, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'
import { useBuscaRapidaStore } from '@/hooks/use-busca-rapida'
import { useListasLembradasStore } from '@/hooks/use-listas-lembradas'
import { usePreferenciasStore } from '@/hooks/use-preferencias-store'
import { useRecentesStore } from '@/hooks/use-recentes'
import { useSessionStore } from '@/hooks/use-session-store'
import { notificarErro } from '@/libs/query-client'
import '@/libs/zod'
import type { SessaoUsuario } from '@/models/auth.model'
import { empresaVazia } from '@/models/empresa.model'
import { routeTree } from '@/routeTree.gen'
import { painel } from './dados'

/**
 * Abre o app inteiro numa URL, como o usuário faria, com um servidor falso no lugar da API.
 * Serve para testar a tela montada: rota, parâmetros da URL, consultas, tabela e navegação.
 *
 *   const tela = abrirTela('/clientes?busca=maria', {
 *     api: { 'GET /clientes': pagina([cliente]) },
 *   })
 *   await screen.findByText('Maria')
 *   expect(tela.pedidos('GET /clientes')[0]?.query.get('busca')).toBe('maria')
 */

export const ADMIN: SessaoUsuario = { id: 1, usuario: 'ana', role: 'admin' }
export const COMUM: SessaoUsuario = { id: 2, usuario: 'bruno', role: 'usuario' }

export interface Pedido {
  rota: string
  query: URLSearchParams
  corpo: unknown
}

/** Resposta com status diferente de 200 (ex.: `resposta(404, { message: '...' })`). */
export class Resposta {
  constructor(
    readonly status: number,
    readonly corpo?: unknown,
  ) {}
}
export const resposta = (status: number, corpo?: unknown) => new Resposta(status, corpo)

type Responder = unknown | ((pedido: Pedido) => unknown)

interface Opcoes {
  /** Quem está logado; `null` = ninguém (o servidor responde 401 em /auth/me). */
  usuario?: SessaoUsuario | null
  /** Respostas por "MÉTODO /caminho" (sem /api e sem a query). Valem por cima das padrão. */
  api?: Record<string, Responder>
}

const padrao = (usuario: SessaoUsuario | null): Record<string, Responder> => ({
  'GET /auth/me': usuario ?? resposta(401, { message: 'Você precisa estar autenticado' }),
  'POST /auth/refresh': resposta(401),
  'GET /auth/setup': { needsSetup: false },
  'GET /sistema': { versao: '2.1.0' },
  'GET /empresa': empresaVazia,
  'GET /painel': painel(),
})

afterEach(() => vi.unstubAllGlobals())

// Cada tela é carregada sob demanda (code splitting): na primeira vez o Vite ainda transforma o código
// dela, o que com a cobertura ligada passa fácil de 1 s (a espera padrão do findBy/waitFor).
configure({ asyncUtilTimeout: 20_000 })
vi.setConfig({ testTimeout: 60_000 })

export function abrirTela(url: string, { usuario = ADMIN, api = {} }: Opcoes = {}) {
  // Stores globais (zustand) sobrevivem entre testes: cada tela começa do zero.
  useSessionStore.setState({ situacao: 'desconhecida', usuario: null })
  useBuscaRapidaStore.setState({ aberta: false })
  useRecentesStore.setState({ porUsuario: {} })
  useListasLembradasStore.setState({ buscas: {} })
  usePreferenciasStore.setState({
    menuRecolhido: false,
    tamanhoDeLetra: 1,
    modeloDeImpressao: 'novo',
  })
  const respostas = { ...padrao(usuario), ...api }
  const feitos: Pedido[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string, opcoes: RequestInit = {}) => {
      const endereco = new URL(entrada, 'http://127.0.0.1')
      const rota = `${opcoes.method ?? 'GET'} ${endereco.pathname.replace(/^\/api/, '')}`
      const corpo =
        typeof opcoes.body === 'string' ? JSON.parse(opcoes.body) : (opcoes.body ?? undefined)
      const pedido = { rota, query: endereco.searchParams, corpo }
      feitos.push(pedido)

      const responder = respostas[rota]
      if (responder === undefined) {
        // Pedido que o teste não previu: falha alto em vez de devolver algo vazio.
        return new Response(JSON.stringify({ message: `rota não prevista no teste: ${rota}` }), {
          status: 599,
        })
      }
      const valor = typeof responder === 'function' ? responder(pedido) : responder
      if (valor instanceof Resposta) {
        return new Response(valor.corpo === undefined ? null : JSON.stringify(valor.corpo), {
          status: valor.status,
        })
      }
      return valor === undefined
        ? new Response(null, { status: 204 })
        : new Response(JSON.stringify(valor))
    }),
  )

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: notificarErro }),
    mutationCache: new MutationCache({ onError: notificarErro }),
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    router,
    queryClient,
    /** Caminho atual (sem a query). */
    caminho: () => router.state.location.pathname,
    /** Parâmetros atuais da URL, já convertidos pelo roteador. */
    busca: () => router.state.location.search as Record<string, unknown>,
    /** Pedidos feitos ao servidor, de todas as rotas ou de uma ("GET /clientes"). */
    pedidos: (rota?: string) => (rota ? feitos.filter((p) => p.rota === rota) : feitos),
    /** O último pedido de uma rota (falha se não houve nenhum). */
    ultimo: (rota: string) => {
      const lista = feitos.filter((p) => p.rota === rota)
      expect(lista, `nenhum pedido ${rota}`).not.toHaveLength(0)
      return lista[lista.length - 1] as Pedido
    },
  }
}

/** Espera o roteador chegar a um caminho (redirecionamentos e navegação são assíncronos). */
export const esperarCaminho = (tela: ReturnType<typeof abrirTela>, caminho: string) =>
  waitFor(() => expect(tela.caminho()).toBe(caminho))

/** Espera a tela terminar de carregar (o título da página aparece). */
export const esperarTitulo = (titulo: string | RegExp) =>
  screen.findByRole('heading', { name: titulo })
