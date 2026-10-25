import type { RelatorioImportacao } from '@/models/importacao.model'
import { ApiError } from './api'

export const importacaoService = {
  /** Envia o .sql como bytes crus (o arquivo do sistema antigo tem alguns MB). */
  async importarLegado(arquivo: File): Promise<RelatorioImportacao> {
    const resposta = await fetch('/api/import/legacy', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/octet-stream' },
      body: arquivo,
    }).catch(() => {
      throw new ApiError(0, ['Não foi possível conectar ao servidor.'])
    })

    const corpo = (await resposta.json().catch(() => null)) as
      | (RelatorioImportacao & { message?: string | string[] })
      | null
    if (!resposta.ok) {
      const mensagens = [corpo?.message ?? 'Não foi possível importar o arquivo.'].flat()
      throw new ApiError(resposta.status, mensagens)
    }
    return corpo as RelatorioImportacao
  },
}
