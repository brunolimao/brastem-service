import { describe, expect, it } from 'vitest'
import { CP850_ALTA, repararAcentos } from './acentos.js'

/** O que o PowerShell faz: bytes UTF-8 lidos como CP850 (só para os testes). */
const estragar = (texto: string) =>
  [...Buffer.from(texto, 'utf8')]
    .map((byte) => (byte < 0x80 ? String.fromCharCode(byte) : CP850_ALTA[byte - 0x80]))
    .join('')

describe('repararAcentos (dump salvo pelo PowerShell)', () => {
  it.each([
    ['FERN├âO DIAS', 'FERNÃO DIAS'],
    ['S├âO PAULO', 'SÃO PAULO'],
    ['GRA├çA', 'GRAÇA'],
    ['SAGRADA FAM├ìLIA', 'SAGRADA FAMÍLIA'],
  ])('%s → %s (como aparecia no gráfico de bairros)', (estragado, certo) => {
    expect(repararAcentos(estragado).texto).toBe(certo)
  })

  it('volta qualquer texto em português ao original, contando os trechos consertados', () => {
    const original =
      "INSERT INTO `Clientes` VALUES (1,'João Ávila','Não liga; troca do compressor – 90 dias “garantia”','São José')"
    const { texto, reparados } = repararAcentos(estragar(original))
    expect(texto).toBe(original)
    // Um trecho por caractere fora do ASCII (ã, Á, –, “, ”, é...).
    expect(reparados).toBe([...original].filter((c) => c.charCodeAt(0) > 0x7f).length)
  })

  it('arquivo sem a assinatura do PowerShell fica intacto, mesmo com combinações raras', () => {
    // "ãé" e "Íó" seriam lidos como acento quebrado; sem nenhum "├"/"┬" no arquivo, nada muda.
    for (const certo of ['Joãé', 'MÍó', 'ÓÇÇ']) {
      expect(repararAcentos(certo)).toEqual({ texto: certo, reparados: 0 })
    }
  })

  it('com a assinatura, sequência que não forma UTF-8 válido fica como está', () => {
    expect(repararAcentos('S├âO ÓÇÇ').texto).toBe('SÃO ÓÇÇ')
  })

  it('não mexe em texto que já está certo (inclusive Ô e acentos seguidos)', () => {
    for (const certo of ['SÃO PAULO', 'Ônibus', 'PÔR DO SOL', 'AÇÃO', 'ÔÉ', 'Graça ├ teste']) {
      expect(repararAcentos(certo)).toEqual({ texto: certo, reparados: 0 })
    }
  })
})
