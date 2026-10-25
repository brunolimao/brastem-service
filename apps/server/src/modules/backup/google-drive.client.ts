import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { GoogleOauthService } from './google-oauth.service.js'

const API = 'https://www.googleapis.com/drive/v3/files'
const API_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const NOME_DA_PASTA = 'Brastem-Service Backups'

export interface ArquivoDrive {
  id: string
  nome: string
  tamanho: number
  criadoEm: string
}

interface ArquivoDriveApi {
  id: string
  name: string
  size?: string
  createdTime: string
}

/** Falha numa chamada ao Drive (rede fora, permissão, cota...). */
export class ErroDrive extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroDrive'
  }
}

const paraArquivo = (item: ArquivoDriveApi): ArquivoDrive => ({
  id: item.id,
  nome: item.name,
  tamanho: Number(item.size ?? 0),
  criadoEm: item.createdTime,
})

/** O mínimo da API REST do Google Drive de que o backup precisa (sem trazer o SDK inteiro). */
@Injectable()
export class GoogleDriveClient {
  constructor(private readonly oauth: GoogleOauthService) {}

  private async chamar(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.oauth.tokenDeAcesso()
    let resposta: Response
    try {
      resposta = await fetch(url, {
        ...init,
        headers: { ...init.headers, authorization: `Bearer ${token}` },
      })
    } catch {
      throw new ErroDrive(0, 'sem conexão com a internet')
    }
    if (!resposta.ok) {
      const corpo = (await resposta.json().catch(() => null)) as {
        error?: { message?: string }
      } | null
      throw new ErroDrive(resposta.status, corpo?.error?.message ?? `erro ${resposta.status}`)
    }
    return resposta
  }

  /** Pasta onde os backups ficam. Se foi apagada (ou está na lixeira), cria outra. */
  async garantirPasta(): Promise<string> {
    const existente = this.oauth.pastaId()
    if (existente) {
      try {
        const resposta = await this.chamar(`${API}/${existente}?fields=id,trashed`)
        const pasta = (await resposta.json()) as { id: string; trashed?: boolean }
        if (!pasta.trashed) return pasta.id
      } catch (erro) {
        if (!(erro instanceof ErroDrive) || erro.status !== 404) throw erro
      }
    }

    const resposta = await this.chamar(`${API}?fields=id`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: NOME_DA_PASTA, mimeType: 'application/vnd.google-apps.folder' }),
    })
    const { id } = (await resposta.json()) as { id: string }
    this.oauth.salvarPastaId(id)
    return id
  }

  async enviar(nome: string, conteudo: Buffer): Promise<ArquivoDrive> {
    const pasta = await this.garantirPasta()
    const limite = `brastem-${randomBytes(12).toString('hex')}`
    const metadados = JSON.stringify({ name: nome, parents: [pasta] })

    const corpo = Buffer.concat([
      Buffer.from(
        `--${limite}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${metadados}\r\n` +
          `--${limite}\r\ncontent-type: application/gzip\r\n\r\n`,
      ),
      conteudo,
      Buffer.from(`\r\n--${limite}--`),
    ])

    const resposta = await this.chamar(
      `${API_UPLOAD}?uploadType=multipart&fields=id,name,size,createdTime`,
      {
        method: 'POST',
        headers: { 'content-type': `multipart/related; boundary=${limite}` },
        body: corpo,
      },
    )
    return paraArquivo((await resposta.json()) as ArquivoDriveApi)
  }

  /** Backups na pasta, do mais novo para o mais antigo. */
  async listar(): Promise<ArquivoDrive[]> {
    const pasta = await this.garantirPasta()
    const parametros = new URLSearchParams({
      q: `'${pasta}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id,name,size,createdTime)',
      pageSize: '200',
    })
    const resposta = await this.chamar(`${API}?${parametros}`)
    const { files } = (await resposta.json()) as { files: ArquivoDriveApi[] }
    return files.map(paraArquivo)
  }

  async baixar(id: string): Promise<Buffer> {
    const resposta = await this.chamar(`${API}/${encodeURIComponent(id)}?alt=media`)
    return Buffer.from(await resposta.arrayBuffer())
  }

  async excluir(id: string): Promise<void> {
    await this.chamar(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }
}
