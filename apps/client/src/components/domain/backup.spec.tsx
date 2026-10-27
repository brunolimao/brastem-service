import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EstadoBackup, EstadoGoogle, ListaBackups } from '@/models/backup.model'
import { BackupGoogleCard } from './backup-google-card'
import { BackupLista } from './backup-lista'
import { BackupStatusCard } from './backup-status-card'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))

/** Servidor falso: responde por "MÉTODO /caminho" e guarda os pedidos feitos. */
let respostas: Record<string, unknown>
let pedidos: { rota: string; corpo: unknown; tipo: string | null }[]

beforeEach(() => {
  respostas = {}
  pedidos = []
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.warning).mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, opcoes: RequestInit = {}) => {
      const rota = `${opcoes.method ?? 'GET'} ${url.replace(/^\/api/, '')}`
      // JSON vira objeto; um arquivo (Blob) fica como veio.
      const corpo = typeof opcoes.body === 'string' ? JSON.parse(opcoes.body) : opcoes.body
      pedidos.push({ rota, corpo, tipo: new Headers(opcoes.headers).get('content-type') })
      const resposta = respostas[rota]
      return resposta === undefined
        ? new Response(null, { status: 204 })
        : new Response(JSON.stringify(resposta))
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const rotasPedidas = () => pedidos.map((pedido) => pedido.rota)

const renderizar = (elemento: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const resultado = render(
    <QueryClientProvider client={queryClient}>{elemento}</QueryClientProvider>,
  )
  return {
    ...resultado,
    rerender: (novo: ReactElement) =>
      resultado.rerender(<QueryClientProvider client={queryClient}>{novo}</QueryClientProvider>),
  }
}

const estado = (google: Partial<EstadoGoogle> = {}, outros: Partial<EstadoBackup> = {}) =>
  ({
    google: {
      configurado: true,
      conectado: false,
      email: null,
      origemCredenciais: 'app',
      ...google,
    },
    ultimoBackup: null,
    ultimoEnvioDrive: null,
    ultimoErro: null,
    pendenteDrive: false,
    proximoBackup: null,
    ...outros,
  }) satisfies EstadoBackup

describe('BackupGoogleCard', () => {
  it('sem credenciais, pede o ID e a chave do Google e salva', async () => {
    renderizar(
      <BackupGoogleCard estado={estado({ configurado: false, origemCredenciais: null })} />,
    )
    expect(screen.getByText('Não conectado')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('ID do cliente (Client ID)'), {
      target: { value: 'curto' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar credenciais' }))
    expect(await screen.findByText('Cole o ID do cliente completo')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('ID do cliente (Client ID)'), {
      target: { value: '1234-abc.apps.googleusercontent.com' },
    })
    fireEvent.change(screen.getByLabelText('Chave secreta do cliente (Client Secret)'), {
      target: { value: 'GOCSPX-segredo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar credenciais' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Credenciais do Google salvas'))
    expect(pedidos.find((p) => p.rota === 'POST /backup/google/credenciais')?.corpo).toEqual({
      clientId: '1234-abc.apps.googleusercontent.com',
      clientSecret: 'GOCSPX-segredo',
    })
  })

  it('conectar abre o navegador do Windows e espera a autorização (R-CFG-04)', async () => {
    const abrir = vi.spyOn(window, 'open').mockImplementation(() => null)
    respostas['GET /backup/google/conectar'] = { url: 'https://accounts.google.com/o/oauth2/x' }
    const { rerender } = renderizar(<BackupGoogleCard estado={estado()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Conectar ao Google Drive' }))

    expect(
      await screen.findByRole('button', { name: 'Aguardando você autorizar...' }),
    ).toBeDisabled()
    expect(abrir).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/x',
      '_blank',
      'noopener',
    )

    rerender(<BackupGoogleCard estado={estado({ conectado: true, email: 'loja@gmail.com' })} />)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Google Drive conectado'))
    expect(screen.getByText('loja@gmail.com')).toBeInTheDocument()
  })

  it('conectado: mostra a conta e desconecta', async () => {
    renderizar(<BackupGoogleCard estado={estado({ conectado: true, email: 'loja@gmail.com' })} />)
    expect(screen.getByText('Conectado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Desconectar' }))
    await waitFor(() => expect(rotasPedidas()).toContain('DELETE /backup/google'))
  })

  it('credenciais do app podem ser trocadas; as do ambiente (desenvolvimento) não', () => {
    const { unmount } = renderizar(<BackupGoogleCard estado={estado()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Trocar credenciais do Google' }))
    expect(screen.getByLabelText('ID do cliente (Client ID)')).toBeInTheDocument()
    unmount()

    renderizar(<BackupGoogleCard estado={estado({ origemCredenciais: 'ambiente' })} />)
    expect(screen.getByRole('button', { name: 'Conectar ao Google Drive' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trocar credenciais do Google' })).toBeNull()
  })
})

describe('BackupStatusCard', () => {
  const ultimoBackup = {
    criadoEm: '2026-10-26T13:00:00.000Z',
    arquivo: 'brastem-2026-10-26.sqlite.gz',
    tamanho: 2_500_000,
    origem: 'automatico' as const,
  }

  it('sem backup ainda, explica como começar', () => {
    renderizar(<BackupStatusCard estado={estado()} />)
    expect(screen.getByText(/Ainda não foi feito nenhum backup/)).toBeInTheDocument()
  })

  it.each([
    [estado({}, { ultimoBackup }), 'Só neste computador'],
    [estado({ conectado: true }, { ultimoBackup, pendenteDrive: true }), 'Aguardando o envio'],
    [estado({ conectado: true }, { ultimoBackup }), 'No computador e no Google Drive.'],
  ])('diz onde está a cópia mais recente (%#)', (situacao, texto) => {
    renderizar(<BackupStatusCard estado={situacao} />)
    expect(screen.getByText(new RegExp(texto))).toBeInTheDocument()
  })

  it('mostra o último erro em destaque', () => {
    const ultimoErro = { em: '2026-10-26T13:00:00.000Z', mensagem: 'Sem internet' }
    renderizar(<BackupStatusCard estado={estado({}, { ultimoErro })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sem internet')
  })

  it('Fazer backup agora avisa quando o envio ao Google falhou (R-CFG-03, R-BKP-04)', async () => {
    respostas['POST /backup/executar'] = estado(
      { conectado: true },
      { ultimoBackup, ultimoErro: { em: ultimoBackup.criadoEm, mensagem: 'Sem internet' } },
    )
    renderizar(<BackupStatusCard estado={estado()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Fazer backup agora' }))
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        'Backup feito no computador, mas o envio ao Google falhou',
      ),
    )
  })
})

describe('BackupLista (R-CFG-05, R-CFG-06)', () => {
  const lista: ListaBackups = {
    local: [
      { id: 'local-1', nome: 'antigo.sqlite.gz', tamanho: 1000, criadoEm: '2026-10-20T10:00:00Z' },
    ],
    drive: [
      { id: 'drive-1', nome: 'novo.sqlite.gz', tamanho: 2000, criadoEm: '2026-10-25T10:00:00Z' },
    ],
    erroDrive: null,
  }

  const linhas = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((linha) => within(linha).getAllByRole('cell')[2]?.textContent)

  it('junta computador e Drive, do mais novo para o mais antigo', async () => {
    respostas['GET /backup/arquivos'] = lista
    renderizar(<BackupLista />)
    await screen.findByText('novo.sqlite.gz')
    expect(linhas()).toEqual(['novo.sqlite.gz', 'antigo.sqlite.gz'])
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(screen.getByText('Computador')).toBeInTheDocument()
  })

  it('avisa quando não deu para listar o Drive, mas mostra os do computador', async () => {
    respostas['GET /backup/arquivos'] = { ...lista, drive: null, erroDrive: 'sem internet' }
    renderizar(<BackupLista />)
    expect(
      await screen.findByText(/Não consegui listar os backups do Google Drive/),
    ).toBeInTheDocument()
    expect(linhas()).toEqual(['antigo.sqlite.gz'])
  })

  it.each([
    [true, 'está reiniciando'],
    [false, 'Feche e abra'],
  ])(
    'restaurar pede confirmação e prepara a troca (reinicia sozinho: %s)',
    async (reiniciando, aviso) => {
      respostas['GET /backup/arquivos'] = lista
      respostas['POST /backup/restaurar'] = { reiniciando }
      renderizar(<BackupLista />)
      await screen.findByText('novo.sqlite.gz')

      fireEvent.click(screen.getAllByRole('button', { name: 'Restaurar' })[0] as HTMLElement)
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Tudo o que foi feito depois')
      expect(rotasPedidas()).not.toContain('POST /backup/restaurar')

      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Restaurar' }),
      )

      expect(await screen.findByText(new RegExp(aviso))).toBeInTheDocument()
      expect(pedidos.find((p) => p.rota === 'POST /backup/restaurar')?.corpo).toEqual({
        origem: 'drive',
        id: 'drive-1',
      })
    },
  )

  it('restaura de um arquivo escolhido no computador, depois de confirmar (R-BKP-10, R-CFG-07)', async () => {
    respostas['GET /backup/arquivos'] = lista
    respostas['POST /backup/restaurar/arquivo'] = { reiniciando: true }
    renderizar(<BackupLista />)
    await screen.findByText('novo.sqlite.gz')

    const arquivo = new File(['backup'], 'brastem-2026-10-20-090000.sqlite.gz')
    expect(screen.getByLabelText('Arquivo de backup')).toHaveAttribute('accept', '.gz,.sqlite')
    fireEvent.change(screen.getByLabelText('Arquivo de backup'), { target: { files: [arquivo] } })

    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo).toHaveTextContent('brastem-2026-10-20-090000.sqlite.gz')
    expect(dialogo).toHaveTextContent('Tudo o que foi feito depois')
    expect(rotasPedidas()).not.toContain('POST /backup/restaurar/arquivo')

    fireEvent.click(within(dialogo).getByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText(/está reiniciando/)).toBeInTheDocument()
    const enviado = pedidos.find((p) => p.rota === 'POST /backup/restaurar/arquivo')
    expect(enviado?.corpo).toBe(arquivo)
    expect(enviado?.tipo).toBe('application/octet-stream')
  })

  it('cancelar a escolha do arquivo não envia nada', async () => {
    respostas['GET /backup/arquivos'] = lista
    renderizar(<BackupLista />)
    await screen.findByText('novo.sqlite.gz')
    fireEvent.change(screen.getByLabelText('Arquivo de backup'), {
      target: { files: [new File(['x'], 'a.sqlite')] },
    })
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
    )
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(rotasPedidas()).not.toContain('POST /backup/restaurar/arquivo')
    // Limpar o seletor (para o mesmo arquivo poder ser escolhido de novo) não dá para ver no jsdom,
    // que não preenche o valor de campos de arquivo: isso foi conferido no app (Chromium).
  })
})
