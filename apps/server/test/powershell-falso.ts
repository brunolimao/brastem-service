import { CP850_ALTA } from '../src/legacy/acentos.js'

/**
 * O que o PowerShell faz com `mysqldump ... > arquivo.sql`: lê a saída UTF-8 pela página de código do
 * console (CP850) e grava em UTF-16 com BOM. Só para os testes: reproduz o arquivo que chega do usuário.
 */
export const estragarComoPowerShell = (texto: string) =>
  [...Buffer.from(texto, 'utf8')]
    .map((byte) => (byte < 0x80 ? String.fromCharCode(byte) : CP850_ALTA[byte - 0x80]))
    .join('')

export const dumpDoPowerShell = (texto: string) =>
  Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(estragarComoPowerShell(texto), 'utf16le')])
