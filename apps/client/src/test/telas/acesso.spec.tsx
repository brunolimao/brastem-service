import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ADMIN, abrirTela, COMUM, esperarCaminho, esperarTitulo, resposta } from '../tela'

const preencher = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })

describe('login (R-ACE-06)', () => {
  it('sem sessão, qualquer tela leva ao login e, depois de entrar, volta para ela', async () => {
    const tela = abrirTela('/clientes?busca=maria', {
      usuario: null,
      api: {
        'POST /auth/login': ADMIN,
        'GET /clientes': { items: [], total: 0, page: 1, pageSize: 20 },
      },
    })
    await esperarCaminho(tela, '/login')
    expect(tela.busca().redirect).toBe('/clientes?busca=maria')

    await screen.findByLabelText('Usuário')
    preencher('Usuário', 'ana')
    preencher('Senha', 'senha-segura-1')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await esperarCaminho(tela, '/clientes')
    expect(tela.busca().busca).toBe('maria')
    expect(tela.ultimo('POST /auth/login').corpo).toEqual({
      usuario: 'ana',
      senha: 'senha-segura-1',
    })
  })

  it('não segue um "redirect" para fora do app depois do login', async () => {
    const tela = abrirTela('/login?redirect=//site-malicioso.com', {
      usuario: null,
      api: { 'POST /auth/login': ADMIN },
    })
    await screen.findByLabelText('Usuário')
    preencher('Usuário', 'ana')
    preencher('Senha', 'senha-segura-1')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await esperarCaminho(tela, '/')
  })

  it('senha errada mostra o aviso do servidor e continua no login', async () => {
    const tela = abrirTela('/login', {
      usuario: null,
      api: { 'POST /auth/login': resposta(401, { message: 'Usuário ou senha inválidos' }) },
    })
    await screen.findByLabelText('Usuário')
    preencher('Usuário', 'ana')
    preencher('Senha', 'errada')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Usuário ou senha inválidos')).toBeInTheDocument()
    expect(tela.caminho()).toBe('/login')
  })

  it('quem já está logado e abre o login vai para o início', async () => {
    const tela = abrirTela('/login')
    await esperarCaminho(tela, '/')
    expect(await esperarTitulo('Olá, ana')).toBeInTheDocument()
  })
})

describe('primeiro acesso (R-ACE-01)', () => {
  it('banco sem usuários: o login leva ao primeiro acesso', async () => {
    const tela = abrirTela('/login', {
      usuario: null,
      api: { 'GET /auth/setup': { needsSetup: true } },
    })
    await esperarCaminho(tela, '/primeiro-acesso')
  })

  it('cria o administrador (senhas iguais) e vai para o login', async () => {
    const tela = abrirTela('/primeiro-acesso', {
      usuario: null,
      api: {
        'GET /auth/setup': { needsSetup: true },
        'POST /auth/setup': { ok: true },
      },
    })
    await screen.findByText('Primeiro acesso')
    preencher('Senha', 'senha-segura-1')
    preencher('Repita a senha', 'outra-senha-1')
    fireEvent.click(screen.getByRole('button', { name: 'Criar administrador' }))
    expect(await screen.findByText('As senhas não conferem')).toBeInTheDocument()
    expect(tela.pedidos('POST /auth/setup')).toHaveLength(0)

    preencher('Repita a senha', 'senha-segura-1')
    fireEvent.click(screen.getByRole('button', { name: 'Criar administrador' }))
    await waitFor(() =>
      expect(tela.ultimo('POST /auth/setup').corpo).toEqual({
        usuario: 'admin',
        senha: 'senha-segura-1',
      }),
    )
  })

  it('com usuários já cadastrados, primeiro acesso e importação levam ao login', async () => {
    const tela = abrirTela('/primeiro-acesso', { usuario: null })
    await esperarCaminho(tela, '/login')
    const outra = abrirTela('/importar', { usuario: null })
    await esperarCaminho(outra, '/login')
  })
})

describe('importar do sistema antigo', () => {
  it('envia o .sql, mostra o resumo com avisos e segue para o login', async () => {
    let jaImportou = false
    const tela = abrirTela('/importar', {
      usuario: null,
      api: {
        'GET /auth/setup': () => ({ needsSetup: !jaImportou }),
        'POST /import/legacy': () => {
          jaImportou = true
          return {
            tabelas: { clientes: { lidos: 10, importados: 9, ignorados: 1 } },
            totais: { ordensServico: 123450, pagamentos: 100000, parcelas: 0 },
            avisos: ['1 cliente sem nome foi ignorado'],
          }
        },
      },
    })
    const arquivo = new File(['INSERT INTO clientes ...'], 'dump.sql', { type: 'text/plain' })
    fireEvent.change(await screen.findByLabelText('Arquivo .sql do sistema antigo'), {
      target: { files: [arquivo] },
    })
    expect(screen.getByRole('button', { name: /dump\.sql/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))

    expect(await screen.findByText('Importação concluída')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.234,50')).toBeInTheDocument()
    expect(screen.getByText('1 cliente sem nome foi ignorado')).toBeInTheDocument()
    expect(tela.ultimo('POST /import/legacy').corpo).toBe(arquivo)

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await esperarCaminho(tela, '/login')
  })

  it('arquivo sem usuários: depois de importar, ainda falta criar o administrador', async () => {
    const tela = abrirTela('/importar', {
      usuario: null,
      api: {
        'GET /auth/setup': { needsSetup: true },
        'POST /import/legacy': {
          tabelas: { clientes: { lidos: 1, importados: 1, ignorados: 0 } },
          totais: { ordensServico: 0, pagamentos: 0, parcelas: 0 },
          avisos: [],
        },
      },
    })
    fireEvent.change(await screen.findByLabelText('Arquivo .sql do sistema antigo'), {
      target: { files: [new File(['x'], 'dump.sql')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }))
    await esperarCaminho(tela, '/primeiro-acesso')
  })
})

describe('telas só do administrador (R-PERM-03)', () => {
  it.each(['/caixa', '/pagamentos', '/relatorios', '/usuarios', '/configuracoes'])(
    'usuário comum em %s volta para o início',
    async (url) => {
      const tela = abrirTela(url, { usuario: COMUM })
      await esperarCaminho(tela, '/')
      expect(await esperarTitulo('Olá, bruno')).toBeInTheDocument()
    },
  )
})

describe('endereço que não existe', () => {
  it('mostra "Página não encontrada" com volta ao início', async () => {
    abrirTela('/nao-existe')
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})
