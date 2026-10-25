import { describe, expect, it } from 'vitest'
import { credenciaisGoogleSchema, juntarBackups } from './backup.model'
import { rotuloParcela } from './caixa.model'
import {
  clienteFormSchema,
  clienteParaForm,
  clienteVazio,
  formParaPayloadCliente,
} from './cliente.model'
import {
  formParaPayloadOrdemServico,
  mostrarPagamentos,
  ordemServicoFormSchema,
  ordemServicoParaForm,
  ordemServicoVazia,
} from './ordem-servico.model'
import { dinheiroTexto, pagamentoVazio } from './pagamento.model'
import { percentual } from './relatorio.model'
import {
  formParaPayloadTransacao,
  opcoesCategoria,
  transacaoFormSchema,
  transacaoVazia,
} from './transacao.model'

const clienteApi = {
  id: 7,
  nome: 'João',
  cpf: '12345678901',
  email: '',
  endereco: 'Rua A',
  numero: '10',
  complemento: '',
  bairro: 'Centro',
  cep: '31910-520',
  uf: 'MG',
  cidade: 'BH',
  negativado: false,
  motivo: 'antigo motivo',
  recomendacao: 'internet' as const,
  referencia: '',
  criadoEm: '2026-10-25T10:00:00.000Z',
  telefones: [{ id: 1, clienteId: 7, nome: 'Casa', telefone: '(31) 3333-4444' }],
  aparelhos: [
    {
      id: 3,
      clienteId: 7,
      ordem: 1,
      nome: 'Geladeira',
      marca: 'Brastemp',
      modelo: '',
      pnc: '',
      garantiaAte: '2026-12-30',
      observacao: '',
    },
  ],
}

describe('cliente', () => {
  it('converte da API para o formulário e de volta, sem chaves de tela nem garantia', () => {
    const form = clienteParaForm(clienteApi)
    expect(form.telefones[0]).toMatchObject({ id: 1, telefone: '(31) 3333-4444' })
    expect(form.aparelhos[0]?.garantiaAte).toBe('2026-12-30')

    const payload = formParaPayloadCliente(form)
    expect(payload.telefones[0]).toEqual({ id: 1, nome: 'Casa', telefone: '(31) 3333-4444' })
    expect(payload.aparelhos[0]).not.toHaveProperty('garantiaAte')
    expect(payload.aparelhos[0]).not.toHaveProperty('chave')
  })

  it('limpa o motivo quando o cliente não está negativado', () => {
    expect(formParaPayloadCliente(clienteParaForm(clienteApi)).motivo).toBe('')
    const negativado = {
      ...clienteParaForm(clienteApi),
      negativado: true,
      motivo: 'Cheque sem fundo',
    }
    expect(formParaPayloadCliente(negativado).motivo).toBe('Cheque sem fundo')
  })

  it('valida os campos obrigatórios e o e-mail', () => {
    expect(clienteFormSchema.safeParse(clienteVazio()).success).toBe(false)
    const valido = { ...clienteParaForm(clienteApi), email: 'a@b.com' }
    expect(clienteFormSchema.safeParse(valido).success).toBe(true)
    expect(clienteFormSchema.safeParse({ ...valido, email: 'nao-e-email' }).success).toBe(false)
  })
})

describe('ordem de serviço', () => {
  it('só exige a data de fechamento quando o status é FECHADO', () => {
    const aberta = ordemServicoVazia()
    expect(ordemServicoFormSchema.safeParse(aberta).success).toBe(true)

    const fechada = ordemServicoFormSchema.safeParse({ ...aberta, status: 'FECHADO' })
    expect(fechada.success).toBe(false)
    expect(fechada.error?.issues[0]?.path).toEqual(['fechamento'])

    expect(
      ordemServicoFormSchema.safeParse({ ...aberta, status: 'FECHADO', fechamento: '2026-10-25' })
        .success,
    ).toBe(true)
  })

  it('manda dinheiro em centavos, descarta pagamentos zerados e omite o que está vazio', () => {
    const payload = formParaPayloadOrdemServico({
      ...ordemServicoVazia(),
      valor: '1.250,50',
      taxaDeslocamento: '50',
      garantiaDias: '90',
      pagamentos: [
        {
          ...pagamentoVazio(),
          valor: '1.300,50',
          tipo: 'credito',
          parcelas: '3',
          data: '2026-10-25',
        },
        { ...pagamentoVazio(), valor: '' },
      ],
    })
    expect(payload).toMatchObject({ valor: 125050, taxaDeslocamento: 5000, garantiaDias: 90 })
    expect(payload.fechamento).toBeUndefined()
    expect(payload.pagamentos).toEqual([
      { valor: 130050, tipo: 'credito', parcelas: 3, data: '2026-10-25', observacao: '' },
    ])
  })

  it('mostra os pagamentos quando fechada, com taxa ou com pagamentos já lançados', () => {
    const base = ordemServicoVazia()
    expect(mostrarPagamentos(base)).toBe(false)
    expect(mostrarPagamentos({ ...base, status: 'FECHADO' })).toBe(true)
    expect(mostrarPagamentos({ ...base, taxaDeslocamento: '30' })).toBe(true)
    expect(mostrarPagamentos({ ...base, pagamentos: [pagamentoVazio()] })).toBe(true)
  })

  it('carrega uma OS da API para o formulário (centavos viram texto em reais)', () => {
    const form = ordemServicoParaForm({
      ordemServico: {
        id: 1,
        clienteId: 7,
        aparelhoId: 3,
        status: 'FECHADO',
        valor: 30000,
        taxaDeslocamento: 0,
        relatado: 'x',
        identificado: '',
        solucionado: '',
        observacao: '',
        garantiaDias: 90,
        isGarantia: false,
        abertura: '2026-09-30',
        fechamento: '2026-10-01',
        criadoEm: '2026-09-30T10:00:00.000Z',
      },
      cliente: clienteApi,
      aparelho: clienteApi.aparelhos[0] as never,
      telefones: [],
      pagamentos: [
        { id: 1, tipo: 'pix', parcelas: 0, data: '2026-10-01', valor: 5000, observacao: '' },
      ],
      ultimasOrdens: [],
    })
    expect(form).toMatchObject({ valor: '300,00', taxaDeslocamento: '', garantiaDias: '90' })
    expect(form.pagamentos[0]).toMatchObject({ valor: '50,00', tipo: 'pix', parcelas: '0' })
  })
})

describe('dinheiroTexto', () => {
  it.each(['', '150', '150,5', '150,50', '1.250,75', '1250.75'])('aceita %s', (valor) => {
    expect(dinheiroTexto.safeParse(valor).success).toBe(true)
  })

  it.each(['abc', '1,234', '12,3,4'])('rejeita %s', (valor) => {
    expect(dinheiroTexto.safeParse(valor).success).toBe(false)
  })
})

describe('lançamentos (receita/despesa)', () => {
  it('categorias são diferentes para receita e despesa', () => {
    expect(opcoesCategoria('receita').map((o) => o.valor)).toEqual(['venda', 'gorjeta', 'outros'])
    expect(opcoesCategoria('despesa').map((o) => o.valor)).toContain('peca')
    expect(opcoesCategoria('receita').map((o) => o.valor)).not.toContain('peca')
  })

  it('exige descrição e valor maior que zero', () => {
    const base = transacaoVazia('despesa')
    expect(transacaoFormSchema.safeParse(base).success).toBe(false)
    expect(
      transacaoFormSchema.safeParse({ ...base, descricao: 'Compressor', valor: '0,00' }).success,
    ).toBe(false)
    expect(
      transacaoFormSchema.safeParse({ ...base, descricao: 'Compressor', valor: '100' }).success,
    ).toBe(true)
  })

  it('manda centavos e só envia pagamentos quando houver', () => {
    const base = { ...transacaoVazia('despesa'), descricao: 'Compressor', valor: '1.250,50' }
    const semPagamentos = formParaPayloadTransacao('despesa', base)
    expect(semPagamentos).toMatchObject({ tipo: 'despesa', valor: 125050, categoria: 'transporte' })
    expect(semPagamentos.pagamentos).toBeUndefined()

    const comPagamento = formParaPayloadTransacao('despesa', {
      ...base,
      pagamentos: [{ ...pagamentoVazio(), valor: '1.250,50', tipo: 'credito', parcelas: '2' }],
    })
    expect(comPagamento.pagamentos?.[0]).toMatchObject({
      valor: 125050,
      tipo: 'credito',
      parcelas: 2,
    })
  })
})

describe('caixa e relatório', () => {
  it('rotula a parcela', () => {
    expect(rotuloParcela({ numero: 0, totalParcelas: 0 })).toBe('À vista')
    expect(rotuloParcela({ numero: 2, totalParcelas: 3 })).toBe('2/3')
  })

  it('calcula percentual sem dividir por zero', () => {
    expect(percentual(1, 3)).toBe(33)
    expect(percentual(3, 3)).toBe(100)
    expect(percentual(5, 0)).toBe(0)
  })
})

describe('backup', () => {
  it('junta os backups do computador e do Drive, do mais novo para o mais antigo', () => {
    const lista = juntarBackups({
      local: [
        { id: 'a.gz', nome: 'a.gz', tamanho: 1, criadoEm: '2026-10-24T10:00:00.000Z' },
        { id: 'b.gz', nome: 'b.gz', tamanho: 1, criadoEm: '2026-10-25T10:00:00.000Z' },
      ],
      drive: [{ id: 'xyz', nome: 'a.gz', tamanho: 1, criadoEm: '2026-10-24T10:00:05.000Z' }],
      erroDrive: null,
    })
    expect(lista.map((b) => `${b.origem}:${b.id}`)).toEqual([
      'local:b.gz',
      'drive:xyz',
      'local:a.gz',
    ])
  })

  it('funciona sem Google Drive conectado', () => {
    const lista = juntarBackups({
      local: [{ id: 'a.gz', nome: 'a.gz', tamanho: 1, criadoEm: '2026-10-24T10:00:00.000Z' }],
      drive: null,
      erroDrive: null,
    })
    expect(lista).toHaveLength(1)
    expect(lista[0]?.origem).toBe('local')
  })

  it('exige as credenciais do Google completas', () => {
    expect(
      credenciaisGoogleSchema.safeParse({ clientId: 'curto', clientSecret: 'x' }).success,
    ).toBe(false)
    expect(
      credenciaisGoogleSchema.safeParse({
        clientId: 'cliente-123456789.apps.googleusercontent.com',
        clientSecret: 'GOCSPX-segredo',
      }).success,
    ).toBe(true)
  })
})
