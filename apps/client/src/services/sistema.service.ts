import { api } from './api'

export const sistemaService = {
  informacoes: () => api<{ versao: string }>('/sistema'),
  /** O app desktop procura e responde numa janela; `iniciado: false` fora dele. */
  procurarAtualizacao: () =>
    api<{ iniciado: boolean }>('/sistema/procurar-atualizacao', { method: 'POST' }),
  /** O .zip para o suporte (só administrador). */
  diagnostico: () => api<Blob>('/sistema/diagnostico', { respostaEmArquivo: true }),
}
