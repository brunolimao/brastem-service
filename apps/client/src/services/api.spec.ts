import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, configurarApi } from './api'

const resposta = (status: number, corpo?: unknown) =>
  new Response(corpo === undefined ? null : JSON.stringify(corpo), { status })

describe('api', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const aoExpirarSessao = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    configurarApi({ aoExpirarSessao })
  })

  afterEach(() => {
    fetchMock.mockReset()
    aoExpirarSessao.mockReset()
    vi.unstubAllGlobals()
  })

  it('monta a URL com query, ignorando valores vazios', async () => {
    fetchMock.mockResolvedValueOnce(resposta(200, { ok: true }))
    await api('/clientes', { query: { busca: 'ana', page: 2, campo: '', outro: undefined } })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/clientes?busca=ana&page=2')
  })

  it('envia JSON no corpo e devolve 204 como undefined', async () => {
    fetchMock.mockResolvedValueOnce(resposta(204))
    await expect(api('/usuarios/1', { method: 'DELETE' })).resolves.toBeUndefined()

    fetchMock.mockResolvedValueOnce(resposta(201, { id: 1 }))
    await api('/usuarios', { method: 'POST', body: { usuario: 'ana' } })
    const init = fetchMock.mock.calls[1]?.[1]
    expect(init?.body).toBe('{"usuario":"ana"}')
    expect(init?.headers).toEqual({ 'content-type': 'application/json' })
  })

  it('envia arquivo como bytes crus (application/octet-stream), não como JSON', async () => {
    fetchMock.mockResolvedValueOnce(resposta(200, { reiniciando: true }))
    const arquivo = new File(['dados'], 'backup.sqlite.gz')
    await api('/backup/restaurar/arquivo', { method: 'POST', arquivo })
    const [, opcoes] = fetchMock.mock.calls[0] ?? []
    expect(opcoes?.body).toBe(arquivo)
    expect(opcoes?.headers).toEqual({ 'content-type': 'application/octet-stream' })
  })

  it('transforma erro da API em ApiError com todas as mensagens', async () => {
    fetchMock.mockResolvedValueOnce(
      resposta(400, { message: ['Campo A inválido', 'Campo B inválido'] }),
    )
    const erro = await api('/x').catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ status: 400, messages: ['Campo A inválido', 'Campo B inválido'] })
  })

  it('avisa quando não consegue falar com o servidor', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(api('/x')).rejects.toMatchObject({ status: 0 })
  })

  it('renova a sessão num 401 e repete a chamada', async () => {
    fetchMock
      .mockResolvedValueOnce(resposta(401, { message: 'expirou' }))
      .mockResolvedValueOnce(resposta(200))
      .mockResolvedValueOnce(resposta(200, { ok: 1 }))

    await expect(api('/clientes')).resolves.toEqual({ ok: 1 })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/clientes',
      '/api/auth/refresh',
      '/api/clientes',
    ])
    expect(aoExpirarSessao).not.toHaveBeenCalled()
  })

  it('se a rede cai depois de renovar a sessão, avisa que não conectou (não um erro genérico)', async () => {
    fetchMock
      .mockResolvedValueOnce(resposta(401, { message: 'expirou' }))
      .mockResolvedValueOnce(resposta(200))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(api('/clientes')).rejects.toMatchObject({
      status: 0,
      message: 'Não foi possível conectar ao servidor.',
    })
  })

  it('várias chamadas com 401 ao mesmo tempo disparam uma única renovação', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === '/api/auth/refresh') return resposta(200)
      const jaRenovou = fetchMock.mock.calls.some(([u]) => u === '/api/auth/refresh')
      return jaRenovou ? resposta(200, {}) : resposta(401, {})
    })

    await Promise.all([api('/a'), api('/b'), api('/c')])
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/auth/refresh')).toHaveLength(1)
  })

  it('quando a renovação falha, encerra a sessão e não mostra erro duplicado', async () => {
    fetchMock
      .mockResolvedValueOnce(resposta(401, { message: 'expirou' }))
      .mockResolvedValueOnce(resposta(401))

    await expect(api('/clientes')).rejects.toMatchObject({ status: 401, sessaoExpirada: true })
    expect(aoExpirarSessao).toHaveBeenCalledOnce()
  })

  it('não tenta renovar o login com senha errada', async () => {
    fetchMock.mockResolvedValueOnce(resposta(401, { message: 'Usuário ou senha inválidos' }))
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      messages: ['Usuário ou senha inválidos'],
      sessaoExpirada: false,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
