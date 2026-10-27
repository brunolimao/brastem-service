import type {
  CredenciaisGoogleForm,
  EstadoBackup,
  ListaBackups,
  OrigemBackup,
} from '@/models/backup.model'
import { api } from './api'

export const backupService = {
  estado: () => api<EstadoBackup>('/backup/estado'),
  arquivos: () => api<ListaBackups>('/backup/arquivos'),
  executar: () => api<EstadoBackup>('/backup/executar', { method: 'POST' }),
  restaurar: (origem: OrigemBackup, id: string) =>
    api<{ reiniciando: boolean }>('/backup/restaurar', { method: 'POST', body: { origem, id } }),
  /** Backup escolhido no computador (.sqlite.gz ou .sqlite), enviado como arquivo. */
  restaurarArquivo: (arquivo: File) =>
    api<{ reiniciando: boolean }>('/backup/restaurar/arquivo', { method: 'POST', arquivo }),
  salvarCredenciais: (dados: CredenciaisGoogleForm) =>
    api<void>('/backup/google/credenciais', { method: 'POST', body: dados }),
  urlDeConexao: () => api<{ url: string }>('/backup/google/conectar'),
  desconectar: () => api<void>('/backup/google', { method: 'DELETE' }),
}
