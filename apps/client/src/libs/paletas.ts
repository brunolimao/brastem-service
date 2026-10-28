/**
 * Paletas de cor do sistema (Configurações → Aparência, R-UX-19). Cada uma diz só quatro cores; o resto
 * (hover, bordas do menu, versão do modo escuro) sai delas, para todas seguirem as mesmas regras de
 * contraste (conferidas em `paletas.spec.ts`). O `index.css` traz a primeira como padrão.
 */
export interface Paleta {
  id: string
  nome: string
  /** Fundo do menu lateral (escuro nos dois temas). */
  menu: string
  /** Botões, links e foco no modo claro (texto branco por cima). */
  primaria: string
  /** A mesma cor no modo escuro: mais clara, com texto escuro por cima. */
  primariaEscura: string
  /** Marca do item ativo do menu. */
  destaque: string
}

export const PALETAS = [
  {
    id: 'azul-tomate',
    nome: 'Azul e tomate',
    menu: '#0e1624',
    primaria: '#1f58b6',
    primariaEscura: '#6397ee',
    destaque: '#ff6347',
  },
  {
    id: 'petroleo-ambar',
    nome: 'Petróleo e âmbar',
    menu: '#0f2e33',
    primaria: '#0e6b73',
    primariaEscura: '#5fb8c0',
    destaque: '#f2a93b',
  },
  {
    id: 'grafite-tomate',
    nome: 'Grafite e tomate',
    menu: '#1c1d21',
    primaria: '#2a2c33',
    primariaEscura: '#c9cbd1',
    destaque: '#ff6347',
  },
  {
    id: 'indigo-coral',
    nome: 'Índigo e coral',
    menu: '#1b1f4b',
    primaria: '#3b40c4',
    primariaEscura: '#9a9ef0',
    destaque: '#ff6f59',
  },
  {
    id: 'verde-azulado-laranja',
    nome: 'Verde-azulado e laranja',
    menu: '#0c3b3a',
    primaria: '#0f766e',
    primariaEscura: '#4fc1b5',
    destaque: '#f97316',
  },
  {
    id: 'azul-royal-amarelo',
    nome: 'Azul royal e amarelo',
    menu: '#12307a',
    primaria: '#1d4ed8',
    primariaEscura: '#7fa6f5',
    destaque: '#facc15',
  },
  {
    id: 'verde-floresta-terracota',
    nome: 'Verde-floresta e terracota',
    menu: '#1a2e20',
    primaria: '#2f6b3e',
    primariaEscura: '#7dba8a',
    destaque: '#d0693f',
  },
  {
    id: 'violeta-pessego',
    nome: 'Violeta e pêssego',
    menu: '#241a4a',
    primaria: '#5b3fd1',
    primariaEscura: '#a994f5',
    destaque: '#f59e7b',
  },
] as const satisfies readonly Paleta[]

export type IdPaleta = (typeof PALETAS)[number]['id']

export const PALETA_PADRAO: IdPaleta = 'azul-tomate'

/** Paleta pelo id; preferência antiga ou inválida volta para a padrão. */
export const paletaPorId = (id: string): Paleta =>
  PALETAS.find((paleta) => paleta.id === id) ?? PALETAS[0]

const canais = (hex: string) =>
  [1, 3, 5].map((inicio) => Number.parseInt(hex.slice(inicio, inicio + 2), 16))

/** `base` com uma parte (`quanto`, de 0 a 1) de `outra`. */
export function misturar(base: string, outra: string, quanto: number): string {
  const b = canais(outra)
  return `#${canais(base)
    .map((canal, i) => Math.round(canal * (1 - quanto) + (b[i] ?? 0) * quanto))
    .map((canal) => canal.toString(16).padStart(2, '0'))
    .join('')}`
}

const luminancia = (hex: string) => {
  const [r = 0, g = 0, b = 0] = canais(hex).map((canal) => {
    const c = canal / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG entre duas cores (1 a 21; texto comum pede 4,5). */
export function contraste(a: string, b: string): number {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (clara + 0.05) / (escura + 0.05)
}

/** Fundo dos cartões no modo escuro (`--card` do `index.css`), base do hover escuro. */
export const CARTAO_ESCURO = '#121824'
/** Letra do menu (`--sidebar-foreground`). */
export const LETRA_DO_MENU = '#eef2f8'

/** Variáveis do CSS que a paleta troca, no tema claro ou escuro. */
export function variaveisDaPaleta(paleta: Paleta, escuro: boolean): Record<string, string> {
  const primaria = escuro ? paleta.primariaEscura : paleta.primaria
  return {
    '--primary': primaria,
    '--primary-foreground': escuro ? misturar(paleta.menu, '#000000', 0.6) : '#ffffff',
    '--ring': primaria,
    '--accent': escuro
      ? misturar(CARTAO_ESCURO, paleta.primariaEscura, 0.15)
      : misturar('#ffffff', paleta.primaria, 0.12),
    '--sidebar': paleta.menu,
    '--sidebar-foreground': LETRA_DO_MENU,
    '--sidebar-accent': misturar(paleta.menu, '#ffffff', 0.08),
    '--sidebar-accent-foreground': '#ffffff',
    '--sidebar-border': misturar(paleta.menu, '#ffffff', 0.12),
    '--sidebar-primary': paleta.destaque,
    '--sidebar-ring': paleta.primariaEscura,
  }
}

export function aplicarPaleta(id: string, escuro: boolean) {
  const estilo = document.documentElement.style
  for (const [variavel, valor] of Object.entries(variaveisDaPaleta(paletaPorId(id), escuro))) {
    estilo.setProperty(variavel, valor)
  }
  document.documentElement.dataset.paleta = paletaPorId(id).id
}
