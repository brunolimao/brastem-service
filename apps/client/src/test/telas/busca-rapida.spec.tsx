import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { clienteDetalhe, clienteListado, ordemDetalhe, ordemListada, pagina } from '../dados'
import { abrirTela, esperarCaminho, esperarTitulo } from '../tela'

const api = {
  'GET /clientes': ({ query }: { query: URLSearchParams }) =>
    query.get('busca') === 'joão'
      ? pagina([clienteListado(), clienteListado({ id: 8, nome: 'João Pedro', cpf: '' })])
      : pagina([]),
  'GET /ordens-servico': ({ query }: { query: URLSearchParams }) =>
    query.get('busca') === 'joão' ? pagina([ordemListada()]) : pagina([]),
  'GET /clientes/7': clienteDetalhe(),
  'GET /ordens-servico/42': ordemDetalhe(),
}

const abrirComAtalho = () => fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
const campo = () => screen.getByRole('combobox', { name: 'Buscar cliente ou OS' })
const digitar = (texto: string) => fireEvent.change(campo(), { target: { value: texto } })

describe('busca rápida (Ctrl+K)', () => {
  it('abre com Ctrl+K de qualquer tela e acha clientes e OS', async () => {
    const tela = abrirTela('/', { api })
    await esperarTitulo('Olá, ana')
    abrirComAtalho()
    digitar('joão')

    const lista = await screen.findByRole('listbox', { name: 'Resultados' })
    const opcoes = within(lista).getAllByRole('option')
    expect(opcoes.map((o) => o.textContent)).toEqual([
      expect.stringContaining('João da Silva'),
      expect.stringContaining('João Pedro'),
      expect.stringContaining('OS 42 · João da Silva'),
    ])
    expect(opcoes[0]).toHaveTextContent('123.456.789-01')
    // Sem o "X" de fechar (ficava por cima do campo): Esc ou clicar fora fecham.
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Fechar' })).toBeNull()
    // Destaque neutro: o texto miúdo continua legível no item escolhido.
    expect(opcoes[0]).toHaveClass('aria-selected:bg-muted')
    expect(opcoes[2]).toHaveTextContent('Geladeira · Fechado · 30/09/2026')
    // "Todos" não manda campo: busca em nome, telefone, CPF...
    expect(tela.ultimo('GET /clientes').query.has('campo')).toBe(false)
  })

  it('setas escolhem e Enter abre; a busca fecha e limpa', async () => {
    const tela = abrirTela('/', { api })
    await esperarTitulo('Olá, ana')
    abrirComAtalho()
    digitar('joão')
    await screen.findByRole('listbox')

    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'ArrowDown' }) // não passa do último
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('OS 42')
    fireEvent.keyDown(campo(), { key: 'ArrowUp' })
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('João Pedro')
    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'Enter' })

    await esperarCaminho(tela, '/ordens-servico/42')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    abrirComAtalho()
    expect(campo()).toHaveValue('')
  })

  it('clicar num cliente abre a ficha dele (botão "Buscar" do menu)', async () => {
    const tela = abrirTela('/', { api })
    fireEvent.click(await screen.findByRole('button', { name: /^Buscar\s*Ctrl K$/ }))
    digitar('joão')
    fireEvent.click(await screen.findByRole('option', { name: /João da Silva Código 7/ }))
    await esperarCaminho(tela, '/clientes/7')
  })

  it('pede pelo menos 2 letras e avisa quando não acha nada', async () => {
    const tela = abrirTela('/', { api })
    await esperarTitulo('Olá, ana')
    abrirComAtalho()
    // Relógio falso para passar do tempo de espera da digitação (250 ms) sem esperar de verdade:
    // mesmo assim, uma letra não vai ao servidor.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      digitar('j')
      act(() => vi.advanceTimersByTime(400))
    } finally {
      vi.useRealTimers()
    }
    expect(screen.getByText('Digite pelo menos 2 letras ou números.')).toBeInTheDocument()
    expect(tela.pedidos('GET /clientes')).toHaveLength(0)

    digitar('xyz')
    expect(await screen.findByText('Nada encontrado para "xyz".')).toBeInTheDocument()
    // Uma letra não consulta o servidor.
    expect(tela.pedidos('GET /clientes').map((p) => p.query.get('busca'))).toEqual(['xyz'])
  })
})
