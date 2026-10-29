/**
 * Modelos de tela em teste (branch experimento/modelos-de-tela): o mesmo sistema com outra casca (menu
 * lateral escuro, barra no topo ou menu claro), outra letra e outro Início, para comparar no uso de
 * verdade antes de escolher um. O `index.css` troca letra e cantos por `html[data-modelo]`.
 */
export const MODELOS_DE_TELA = [
  { id: 'oficina', nome: 'A · Oficina', descricao: 'Menu lateral escuro (o de hoje)' },
  { id: 'painel', nome: 'B · Painel', descricao: 'Menu no topo e fila de trabalho' },
  { id: 'balcao', nome: 'C · Balcão', descricao: 'Menu claro e busca em destaque' },
  { id: 'planilha', nome: 'D · Planilha', descricao: 'Compacto, menu no topo' },
  { id: 'cartoes', nome: 'E · Cartões', descricao: 'Espaçoso, menu claro e cartões' },
] as const

export type IdModelo = (typeof MODELOS_DE_TELA)[number]['id']

export const MODELO_PADRAO: IdModelo = 'oficina'

/** Modelo pelo id; preferência antiga ou inválida volta para o padrão. */
export const modeloPorId = (id: string): IdModelo =>
  MODELOS_DE_TELA.find((modelo) => modelo.id === id)?.id ?? MODELO_PADRAO

/** Onde fica o menu de cada modelo. */
export const menuDoModelo = (id: IdModelo): 'lateral-escuro' | 'lateral-claro' | 'topo' =>
  id === 'painel' || id === 'planilha'
    ? 'topo'
    : id === 'balcao' || id === 'cartoes'
      ? 'lateral-claro'
      : 'lateral-escuro'

export function aplicarModelo(id: string) {
  document.documentElement.dataset.modelo = modeloPorId(id)
}
