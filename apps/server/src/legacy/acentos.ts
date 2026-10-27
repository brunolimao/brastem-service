/**
 * Conserta acentos de um dump gerado pelo PowerShell (`mysqldump ... > arquivo.sql`): o PowerShell lê a
 * saída do mysqldump (UTF-8) pela página de código do console (CP850) e grava o resultado, então "ã"
 * (bytes C3 A3) vira "├ú" e "Ã" vira "├â". Aqui cada trecho assim volta aos bytes originais (pela CP850)
 * e é lido de novo como UTF-8; trecho que não forma UTF-8 válido fica como está.
 */

/** Os caracteres dos bytes 0x80 a 0xFF na CP850 (gerado pelo Python: bytes([b]).decode('cp850')). */
export const CP850_ALTA =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ '

const BYTE_DO_CARACTERE = new Map([...CP850_ALTA].map((caractere, i) => [caractere, 0x80 + i]))

/** Classes de caracteres CP850 pela faixa de byte que representam. */
const faixa = (de: number, ate: number) =>
  [...CP850_ALTA.slice(de - 0x80, ate - 0x80 + 1)]
    .map((c) => c.replace(/[\\\]^-]/g, '\\$&'))
    .join('')
const CONTINUACAO = `[${faixa(0x80, 0xbf)}]`
const INICIO_2 = `[${faixa(0xc2, 0xdf)}]`
const INICIO_3 = `[${faixa(0xe0, 0xef)}]`
const SEQUENCIA = new RegExp(`${INICIO_3}${CONTINUACAO}{2}|${INICIO_2}${CONTINUACAO}`, 'gu')

/**
 * Assinatura do problema: "├" e "┬" são os bytes C3 e C2 (início de quase todo acento em UTF-8). Arquivo sem
 * eles não passou pelo PowerShell e fica intacto, mesmo que tenha combinações raras como "ãé".
 */
const ASSINATURA = new RegExp(`[├┬]${CONTINUACAO}`, 'u')

export function repararAcentos(texto: string): { texto: string; reparados: number } {
  if (!ASSINATURA.test(texto)) return { texto, reparados: 0 }
  let reparados = 0
  const reparado = texto.replace(SEQUENCIA, (trecho) => {
    const bytes = Buffer.from([...trecho].map((caractere) => BYTE_DO_CARACTERE.get(caractere) ?? 0))
    const lido = bytes.toString('utf8')
    // Um só caractere, sem o "�" de byte inválido: era mesmo um acento quebrado.
    if (lido.includes('�') || [...lido].length !== 1) return trecho
    reparados += 1
    return lido
  })
  return { texto: reparado, reparados }
}
