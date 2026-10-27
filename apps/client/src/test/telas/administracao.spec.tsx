import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { pagina, usuario } from '../dados'
import { abrirTela, COMUM, esperarTitulo } from '../tela'

describe('Usuários', () => {
  const usuarios = pagina([usuario(), usuario({ id: 2, usuario: 'bruno', role: 'usuario' })])

  it('lista com a função de cada um e o total', async () => {
    abrirTela('/usuarios', { api: { 'GET /usuarios': usuarios } })
    expect(await screen.findByText('2 usuários cadastrados')).toBeInTheDocument()
    const [ana, bruno] = screen.getAllByRole('row').slice(1) as HTMLElement[]
    expect(within(ana as HTMLElement).getByText('Administrador')).toBeInTheDocument()
    expect(within(bruno as HTMLElement).getByText('Usuário')).toBeInTheDocument()
  })

  it('ninguém exclui o próprio usuário (R-USU-02); os outros, depois de confirmar', async () => {
    const tela = abrirTela('/usuarios', {
      api: { 'GET /usuarios': usuarios, 'DELETE /usuarios/2': undefined },
    })
    expect(await screen.findByRole('button', { name: 'Excluir ana' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir bruno' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('não poderá mais entrar')
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }),
    )
    await waitFor(() => expect(tela.pedidos('DELETE /usuarios/2')).toHaveLength(1))
  })

  it('a página da URL vai para o servidor', async () => {
    const tela = abrirTela('/usuarios?page=2', {
      api: { 'GET /usuarios': pagina([usuario({ id: 30 })], 40, 2) },
    })
    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(tela.ultimo('GET /usuarios').query.get('page')).toBe('2')
  })
})

describe('Configurações', () => {
  it('usuário comum vê só Aparência e Atualizações, sem nada do administrador (R-CFG-09)', async () => {
    const tela = abrirTela('/configuracoes', { usuario: COMUM })
    await esperarTitulo('Configurações')
    expect(screen.getByText('Aparência')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Maior' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Procurar atualização' })).toBeInTheDocument()
    for (const deAdmin of [
      'Dados da empresa',
      'Backup automático',
      'Restaurar um backup',
      'Começar do zero',
    ]) {
      expect(screen.queryByText(deAdmin)).toBeNull()
    }
    // Nem pergunta ao servidor o que é só do administrador.
    expect(
      tela
        .pedidos()
        .map((p) => p.rota)
        .filter((r) => /empresa|backup/.test(r)),
    ).toEqual([])
  })

  it('carrega os dados da empresa e o estado do backup', async () => {
    abrirTela('/configuracoes', {
      api: {
        'GET /empresa': {
          nome: 'Assistência Exemplo',
          cnpj: '',
          telefone: '',
          endereco: '',
          cep: '',
        },
        'GET /backup/estado': {
          google: { configurado: false, conectado: false, email: null, origemCredenciais: null },
          ultimoBackup: null,
          ultimoEnvioDrive: null,
          ultimoErro: null,
          pendenteDrive: false,
          proximoBackup: null,
        },
        'GET /backup/arquivos': { local: [], drive: null, erroDrive: null },
      },
    })
    await esperarTitulo('Configurações')
    expect(await screen.findByDisplayValue('Assistência Exemplo')).toBeInTheDocument()
    expect(await screen.findByText('Backup automático')).toBeInTheDocument()
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(await screen.findByText('Nenhum backup ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apagar todos os dados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Procurar atualização' })).toBeInTheDocument()
  })
})
