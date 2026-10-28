import { describe, expect, it } from 'vitest'
import { loginSchema, primeiroAcessoSchema } from './auth.model'
import {
  aparelhoFormSchema,
  aparelhoVazio,
  clienteFormSchema,
  clienteVazio,
  formParaPayloadCliente,
  OPCOES_RECOMENDACAO,
  telefoneVazio,
} from './cliente.model'
import {
  OPCOES_PARCELAS,
  OPCOES_TIPO_PAGAMENTO,
  pagamentoFormSchema,
  pagamentoVazio,
  ROTULO_TIPO_PAGAMENTO,
} from './pagamento.model'

// Escritos a partir do relatório de mutação (Stryker): cada um pega mudanças que passavam despercebidas.

interface Resultado {
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}

/** Primeira mensagem de erro de cada campo, a que a tela mostra (ex.: { senha: 'Use pelo menos 8 caracteres' }). */
const erros = (resultado: Resultado) => {
  const porCampo: Record<string, string> = {}
  for (const problema of resultado.error?.issues ?? []) {
    porCampo[problema.path.join('.')] ??= problema.message
  }
  return porCampo
}

describe('login e primeiro acesso (R-ACE-01)', () => {
  it('login pede usuário e senha', () => {
    expect(erros(loginSchema.safeParse({ usuario: '', senha: '' }))).toEqual({
      usuario: 'Informe o usuário',
      senha: 'Informe a senha',
    })
    expect(loginSchema.safeParse({ usuario: 'ana', senha: 'x' }).success).toBe(true)
  })

  const acesso = (dados: Partial<{ usuario: string; senha: string; confirmarSenha: string }>) =>
    primeiroAcessoSchema.safeParse({
      usuario: 'admin',
      senha: 'senha-segura',
      confirmarSenha: 'senha-segura',
      ...dados,
    })

  it('usuário de 3 a 50 caracteres', () => {
    expect(erros(acesso({ usuario: 'ab' }))).toEqual({ usuario: 'Use pelo menos 3 caracteres' })
    expect(acesso({ usuario: 'abc' }).success).toBe(true)
    expect(acesso({ usuario: 'a'.repeat(50) }).success).toBe(true)
    expect(erros(acesso({ usuario: 'a'.repeat(51) }))).toEqual({
      usuario: 'Use no máximo 50 caracteres',
    })
  })

  it('senha de 8 a 100 caracteres', () => {
    const curta = '1234567'
    expect(erros(acesso({ senha: curta, confirmarSenha: curta }))).toEqual({
      senha: 'Use pelo menos 8 caracteres',
    })
    const oito = '12345678'
    expect(acesso({ senha: oito, confirmarSenha: oito }).success).toBe(true)
    const cem = 'a'.repeat(100)
    expect(acesso({ senha: cem, confirmarSenha: cem }).success).toBe(true)
    const longa = 'a'.repeat(101)
    expect(erros(acesso({ senha: longa, confirmarSenha: longa }))).toEqual({
      senha: 'Use no máximo 100 caracteres',
    })
  })

  it('pede para repetir a senha e confere se as duas são iguais', () => {
    expect(erros(acesso({ confirmarSenha: '' }))).toEqual({ confirmarSenha: 'Repita a senha' })
    expect(erros(acesso({ confirmarSenha: 'outra-senha' }))).toEqual({
      confirmarSenha: 'As senhas não conferem',
    })
  })
})

describe('cadastro de cliente', () => {
  it('cliente novo começa vazio, com um telefone e um aparelho em branco e "Cliente antigo"', () => {
    const { telefones, aparelhos, ...campos } = clienteVazio()
    expect(campos).toEqual({
      nome: '',
      cpf: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      recomendacao: 'antigo',
      negativado: false,
      motivo: '',
      referencia: '',
      dataCadastro: '',
    })
    expect(telefones).toEqual([{ chave: expect.any(String), nome: '', telefone: '' }])
    expect(aparelhos).toEqual([
      {
        chave: expect.any(String),
        nome: '',
        marca: '',
        modelo: '',
        pnc: '',
        observacao: '',
        garantiaAte: null,
      },
    ])
    // Cada linha nova tem a própria chave (a tela usa para não misturar as linhas).
    expect(telefoneVazio().chave).not.toBe(telefoneVazio().chave)
    expect(aparelhoVazio().chave).not.toBe(aparelhoVazio().chave)
  })

  it('opções de "Como conheceu" com o rótulo de cada uma', () => {
    expect(OPCOES_RECOMENDACAO).toEqual([
      { valor: 'antigo', rotulo: 'Cliente antigo' },
      { valor: 'indicacao', rotulo: 'Indicação' },
      { valor: 'internet', rotulo: 'Internet' },
      { valor: 'porta', rotulo: 'Porta' },
      { valor: 'outros', rotulo: 'Outros' },
    ])
  })

  it('valida e-mail, UF com 2 letras e o nome do aparelho', () => {
    const valido = { ...clienteVazio(), nome: 'Maria', telefones: [], aparelhos: [] }
    expect(clienteFormSchema.safeParse(valido).success).toBe(true)
    expect(erros(clienteFormSchema.safeParse({ ...valido, email: 'nao-e-email' }))).toEqual({
      email: 'E-mail inválido',
    })
    expect(clienteFormSchema.safeParse({ ...valido, uf: 'MG' }).success).toBe(true)
    expect(erros(clienteFormSchema.safeParse({ ...valido, uf: 'MGS' }))).toEqual({
      uf: 'Use a sigla com 2 letras',
    })
    expect(erros(aparelhoFormSchema.safeParse(aparelhoVazio()))).toEqual({
      nome: 'Informe o aparelho',
    })
  })

  it('data de cadastro vazia não vai para a API (o servidor usa hoje); preenchida, vai (R-CLI-04)', () => {
    const cliente = { ...clienteVazio(), nome: 'Maria' }
    expect(formParaPayloadCliente(cliente).dataCadastro).toBeUndefined()
    expect(formParaPayloadCliente({ ...cliente, dataCadastro: '2026-10-01' }).dataCadastro).toBe(
      '2026-10-01',
    )
  })
})

describe('pagamentos no formulário', () => {
  it('cada forma de pagamento com o seu rótulo, na ordem da lista', () => {
    expect(ROTULO_TIPO_PAGAMENTO).toEqual({
      dinheiro: 'Dinheiro',
      debito: 'Débito',
      credito: 'Crédito',
      pix: 'Pix',
      parcelado: 'Pix parcelado',
      cheque: 'Cheque',
      boleto: 'Boleto',
      transferencia: 'Transferência',
    })
    expect(OPCOES_TIPO_PAGAMENTO[0]).toEqual({ valor: 'dinheiro', rotulo: 'Dinheiro' })
    expect(OPCOES_TIPO_PAGAMENTO).toHaveLength(8)
  })

  it('parcelas: à vista e de 1x a 12x (R-PAG-01, R-PAG-02)', () => {
    expect(OPCOES_PARCELAS).toHaveLength(13)
    expect(OPCOES_PARCELAS[0]).toEqual({ valor: '0', rotulo: 'À vista' })
    expect(OPCOES_PARCELAS[1]).toEqual({ valor: '1', rotulo: '1x' })
    expect(OPCOES_PARCELAS[12]).toEqual({ valor: '12', rotulo: '12x' })
  })

  it('pagamento novo: em dinheiro, à vista, sem valor e com a data de hoje', () => {
    const pagamento = pagamentoVazio()
    expect(pagamento).toEqual({
      chave: expect.any(String),
      valor: '',
      tipo: 'dinheiro',
      parcelas: '0',
      data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      observacao: '',
    })
    expect(pagamentoVazio().chave).not.toBe(pagamento.chave)
  })

  it('valor inválido e data vazia têm mensagem (R-PAG-07)', () => {
    const pagamento = { ...pagamentoVazio(), valor: '100' }
    expect(pagamentoFormSchema.safeParse(pagamento).success).toBe(true)
    expect(erros(pagamentoFormSchema.safeParse({ ...pagamento, valor: 'abc' }))).toEqual({
      valor: 'Valor inválido',
    })
    expect(erros(pagamentoFormSchema.safeParse({ ...pagamento, data: '' }))).toEqual({
      data: 'Informe a data',
    })
  })
})
