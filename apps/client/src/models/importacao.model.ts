export interface ResumoTabela {
  lidos: number
  importados: number
  ignorados: number
}

/** Resposta da importação do sistema antigo (mesmo formato do servidor). */
export interface RelatorioImportacao {
  tabelas: Record<string, ResumoTabela>
  totais: { ordensServico: number; pagamentos: number; parcelas: number }
  avisos: string[]
}

export const ROTULO_TABELA: Record<string, string> = {
  usuarios: 'Usuários',
  clientes: 'Clientes',
  telefones: 'Telefones',
  aparelhos: 'Aparelhos',
  ordens_servico: 'Ordens de serviço',
  transacoes: 'Receitas e despesas',
  pagamentos: 'Pagamentos',
  parcelas: 'Parcelas',
}
