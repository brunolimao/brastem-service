// Testes do conferidor de regras (R-TST-03). Rodam com `node --test scripts/`.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lerEspecificacao, regrasSemTeste } from './conferir-regras.mjs'

const especificacao = `
## Regras

- **R-ABC-01**: uma regra com teste.
- **R-ABC-02**: outra regra, mencionada em R-ABC-01 sem ser definida de novo.
- **R-ABC-03**: regra de trabalho.
- **R-ABC-04**: outra regra de trabalho.

## Testes

- \`x.spec.ts\` — algo (R-ABC-01).
- Sem teste automatizado: R-ABC-03 (é regra de trabalho)
  e R-ABC-04 (continua na linha de baixo).
- \`y.spec.ts\` — outra coisa, que não isenta R-ABC-02.
`

describe('conferir-regras (R-TST-03)', () => {
  it('lê as regras definidas (em negrito) e as declaradas sem teste', () => {
    assert.deepEqual(lerEspecificacao(especificacao), {
      definidas: ['R-ABC-01', 'R-ABC-02', 'R-ABC-03', 'R-ABC-04'],
      isentas: ['R-ABC-03', 'R-ABC-04'],
    })
  })

  it('aponta a regra que nenhum teste cita', () => {
    const testes = ["it('faz a coisa (R-ABC-01)', () => {})"]
    assert.deepEqual(regrasSemTeste({ especificacoes: [especificacao], testes }), ['R-ABC-02'])
  })

  it('citação num comentário vale; menção na especificação não', () => {
    const testes = ['// cobre R-ABC-01 e R-ABC-02']
    assert.deepEqual(regrasSemTeste({ especificacoes: [especificacao], testes }), [])
    assert.deepEqual(regrasSemTeste({ especificacoes: [especificacao], testes: [] }), [
      'R-ABC-01',
      'R-ABC-02',
    ])
  })
})
