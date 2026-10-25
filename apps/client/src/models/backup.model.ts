import { z } from 'zod'

export interface EstadoGoogle {
  configurado: boolean
  conectado: boolean
  email: string | null
  origemCredenciais: 'app' | 'ambiente' | null
}

export interface EstadoBackup {
  google: EstadoGoogle
  ultimoBackup: {
    criadoEm: string
    arquivo: string
    tamanho: number
    origem: 'automatico' | 'manual'
  } | null
  ultimoEnvioDrive: string | null
  ultimoErro: { em: string; mensagem: string } | null
  /** Há um backup no computador que ainda não subiu para o Google Drive. */
  pendenteDrive: boolean
  proximoBackup: string | null
}

export interface ArquivoBackup {
  id: string
  nome: string
  tamanho: number
  criadoEm: string
}

export interface ListaBackups {
  local: ArquivoBackup[]
  drive: ArquivoBackup[] | null
  erroDrive: string | null
}

export type OrigemBackup = 'local' | 'drive'

/** Linha da tabela de backups, juntando o que está no computador e no Drive. */
export interface BackupDisponivel extends ArquivoBackup {
  origem: OrigemBackup
}

export const credenciaisGoogleSchema = z.object({
  clientId: z.string().min(10, 'Cole o ID do cliente completo'),
  clientSecret: z.string().min(5, 'Cole a chave secreta'),
})
export type CredenciaisGoogleForm = z.infer<typeof credenciaisGoogleSchema>

/** Junta os backups do computador e do Drive, do mais novo para o mais antigo. */
export const juntarBackups = (lista: ListaBackups): BackupDisponivel[] =>
  [
    ...lista.local.map((item) => ({ ...item, origem: 'local' as const })),
    ...(lista.drive ?? []).map((item) => ({ ...item, origem: 'drive' as const })),
  ].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
