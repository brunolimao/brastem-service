import { differenceInCalendarDays } from 'date-fns'
import { z } from 'zod'
import { formatarData } from '@/libs/formatters'

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

/** A partir de quantas horas sem backup (ou sem envio ao Drive) o Início avisa (R-BKP-14). */
export const HORAS_PARA_AVISAR_BACKUP = 48

export interface AvisoBackup {
  titulo: string
  descricao: string
}

const haDias = (iso: string, agora: Date) => {
  const dias = differenceInCalendarDays(agora, new Date(iso))
  return dias <= 1 ? 'ontem' : `há ${dias} dias`
}

/**
 * O que avisar no Início sobre o backup, ou null se está tudo em dia (R-BKP-14): backup que nunca
 * rodou por erro, último backup mais velho que 48 h, ou backups parados sem chegar ao Google Drive.
 */
export function avisoDeBackup(estado: EstadoBackup, agora = new Date()): AvisoBackup | null {
  const limite = agora.getTime() - HORAS_PARA_AVISAR_BACKUP * 60 * 60 * 1000
  const antigo = (iso: string | null) => iso === null || Date.parse(iso) < limite
  const erro = estado.ultimoErro ? ` Último erro: ${estado.ultimoErro.mensagem}` : ''
  const { ultimoBackup } = estado

  if (!ultimoBackup) {
    return estado.ultimoErro
      ? {
          titulo: 'O backup automático não está funcionando',
          descricao: `Nenhum backup foi feito ainda.${erro}`,
        }
      : null
  }
  if (antigo(ultimoBackup.criadoEm)) {
    return {
      titulo: 'Backup atrasado',
      descricao: `O último backup é de ${formatarData(ultimoBackup.criadoEm)} (${haDias(ultimoBackup.criadoEm, agora)}).${erro}`,
    }
  }
  if (estado.google.conectado && estado.pendenteDrive && antigo(estado.ultimoEnvioDrive)) {
    return {
      titulo: 'Backups não estão chegando ao Google Drive',
      descricao: estado.ultimoEnvioDrive
        ? `O último envio foi em ${formatarData(estado.ultimoEnvioDrive)} (${haDias(estado.ultimoEnvioDrive, agora)}). Os backups continuam no computador.${erro}`
        : `Nenhum backup chegou ao Drive ainda. Os backups continuam no computador.${erro}`,
    }
  }
  return null
}
