import { describe, expect, it } from 'vitest'
import { progressoDaBarra, scriptDoAviso, textoDoAviso } from './aviso-atualizacao'

describe('aviso de atualização', () => {
  it('descreve cada etapa e some quando não há nada a dizer', () => {
    expect(textoDoAviso({ tipo: 'verificando' })).toBe('Procurando atualizações…')
    expect(textoDoAviso({ tipo: 'baixando', versao: '2.1.0', percentual: 42 })).toBe(
      'Baixando a atualização 2.1.0 (42%)…',
    )
    expect(textoDoAviso({ tipo: 'pronta', versao: '2.1.0' })).toContain('pronta')
    expect(textoDoAviso({ tipo: 'nenhum' })).toBeNull()
  })

  it('mostra o progresso na barra de tarefas (indeterminado ao procurar, apagado ao terminar)', () => {
    expect(progressoDaBarra({ tipo: 'verificando' })).toBe(2)
    expect(progressoDaBarra({ tipo: 'baixando', versao: '2.1.0', percentual: 50 })).toBe(0.5)
    expect(progressoDaBarra({ tipo: 'baixando', versao: '2.1.0', percentual: 150 })).toBe(1)
    expect(progressoDaBarra({ tipo: 'pronta', versao: '2.1.0' })).toBe(-1)
    expect(progressoDaBarra({ tipo: 'nenhum' })).toBe(-1)
  })

  it('gera um script válido que cria ou remove o aviso na página', () => {
    const baixando = scriptDoAviso({ tipo: 'baixando', versao: '2.1.0', percentual: 7 })
    expect(() => new Function(baixando)).not.toThrow()
    expect(baixando).toContain('"Baixando a atualização 2.1.0 (7%)…"')
    expect(scriptDoAviso({ tipo: 'nenhum' })).toContain('const texto = null')
  })
})
