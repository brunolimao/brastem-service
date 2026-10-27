import 'reflect-metadata'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import type { INestApplication } from '@nestjs/common'
import Database from 'better-sqlite3'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarGoogleFalso } from './google-falso.js'

describe('backup e restauração (e2e)', () => {
  let app: INestApplication
  let admin: ReturnType<typeof request.agent>
  const dados = mkdtempSync(join(tmpdir(), 'brastem-backup-'))
  const google = criarGoogleFalso()
  const pastaBackups = join(dados, 'backups')

  const credenciais = { usuario: 'admin', senha: 'senha-segura-1' }

  beforeAll(async () => {
    process.env.DATA_DIR = dados
    vi.stubGlobal('fetch', google.fetch)

    const { createApp } = await import('../src/bootstrap.js')
    app = await createApp()
    await app.init()

    await request(app.getHttpServer()).post('/api/auth/setup').send(credenciais).expect(201)
    admin = request.agent(app.getHttpServer())
    await admin.post('/api/auth/login').send(credenciais).expect(200)
  })

  afterAll(async () => {
    await app.close()
    vi.unstubAllGlobals()
    rmSync(dados, { recursive: true, force: true })
    Reflect.deleteProperty(process.env, 'DATA_DIR')
  })

  beforeEach(() => {
    google.chamadas.length = 0
  })

  /** O backup mais recente feito de verdade pela API (os outros arquivos da pasta são de enfeite nos testes). */
  const nomeDoUltimoBackup = async () =>
    (await admin.get('/api/backup/estado')).body.ultimoBackup.arquivo as string

  const arquivosLocais = () => (existsSync(pastaBackups) ? readdirSync(pastaBackups) : [])

  it('só administrador mexe em backup', async () => {
    await admin
      .post('/api/usuarios')
      .send({ usuario: 'maria', senha: 'outra-senha-1', role: 'usuario' })
      .expect(201)
    const maria = request.agent(app.getHttpServer())
    await maria
      .post('/api/auth/login')
      .send({ usuario: 'maria', senha: 'outra-senha-1' })
      .expect(200)

    await maria.get('/api/backup/estado').expect(403)
    await maria.post('/api/backup/executar').expect(403)
    await maria.post('/api/backup/restaurar').send({ origem: 'local', id: 'x' }).expect(403)
    // Nem com a própria senha certa um usuário comum apaga os dados (R-BKP-12).
    await maria.post('/api/backup/apagar-tudo').send({ senha: 'outra-senha-1' }).expect(403)
    expect(existsSync(join(dados, 'restauracao-pendente.sqlite'))).toBe(false)
  })

  it('faz o backup local compactado e registra o estado', async () => {
    const antes = await admin.get('/api/backup/estado').expect(200)
    expect(antes.body).toMatchObject({
      ultimoBackup: null,
      google: { configurado: false, conectado: false },
    })

    const res = await admin.post('/api/backup/executar').expect(200)
    expect(res.body.ultimoBackup.arquivo).toMatch(/^brastem-\d{4}-\d{2}-\d{2}-\d{6}\.sqlite\.gz$/)
    expect(res.body.ultimoBackup.tamanho).toBeGreaterThan(0)
    expect(res.body.pendenteDrive).toBe(false)
    expect(res.body.proximoBackup).not.toBeNull()
    expect(arquivosLocais().some((nome) => nome.endsWith('.sqlite.gz'))).toBe(true)
    // Nada de arquivo temporário sobrando.
    expect(arquivosLocais().some((nome) => nome.endsWith('.tmp'))).toBe(false)
  })

  it('guarda só os 7 backups locais mais recentes', async () => {
    mkdirSync(pastaBackups, { recursive: true })
    for (let dia = 1; dia <= 9; dia++) {
      writeFileSync(join(pastaBackups, `brastem-2020-01-0${dia}-120000.sqlite.gz`), 'x')
    }
    await admin.post('/api/backup/executar').expect(200)

    const guardados = arquivosLocais().filter((nome) => /^brastem-.*\.sqlite\.gz$/.test(nome))
    expect(guardados).toHaveLength(7)
    expect(guardados).not.toContain('brastem-2020-01-01-120000.sqlite.gz')
  })

  describe('Google Drive', () => {
    /** Percorre o fluxo OAuth inteiro (credenciais, consentimento e retorno do Google). */
    const conectar = async () => {
      await admin
        .post('/api/backup/google/credenciais')
        .send({
          clientId: 'cliente-123456789.apps.googleusercontent.com',
          clientSecret: 'segredo-abc',
        })
        .expect(204)
      const { url } = (await admin.get('/api/backup/google/conectar').expect(200)).body as {
        url: string
      }
      const state = new URL(url).searchParams.get('state')
      await request(app.getHttpServer())
        .get(`/api/backup/google/callback?code=c&state=${state}`)
        .expect(200)
    }

    it('recusa conectar sem Client ID e valida os campos', async () => {
      const semCredenciais = await admin.get('/api/backup/google/conectar').expect(400)
      expect(semCredenciais.body.message).toBe(
        'Informe o Client ID e o Client Secret do Google primeiro.',
      )

      const invalido = await admin
        .post('/api/backup/google/credenciais')
        .send({ clientId: 'curto', clientSecret: 'x' })
        .expect(400)
      expect(invalido.body.message).toContain('O campo "clientId" deve ter no mínimo 10 caracteres')
    })

    it('conecta pelo fluxo OAuth com PKCE e rejeita retorno com state desconhecido', async () => {
      await admin
        .post('/api/backup/google/credenciais')
        .send({
          clientId: 'cliente-123456789.apps.googleusercontent.com',
          clientSecret: 'segredo-abc',
        })
        .expect(204)

      const { url } = (await admin.get('/api/backup/google/conectar').expect(200)).body as {
        url: string
      }
      const endereco = new URL(url)
      expect(endereco.origin + endereco.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      )
      expect(endereco.searchParams.get('code_challenge_method')).toBe('S256')
      expect(endereco.searchParams.get('scope')).toContain('auth/drive.file')
      expect(endereco.searchParams.get('scope')).not.toContain('auth/drive ')
      expect(endereco.searchParams.get('redirect_uri')).toMatch(
        /^http:\/\/127\.0\.0\.1:\d+\/api\/backup\/google\/callback$/,
      )

      // O Google redireciona o navegador, sem o cookie de login: o retorno é público, mas exige o state certo.
      const anonimo = request(app.getHttpServer())
      const falso = await anonimo
        .get('/api/backup/google/callback?code=abc&state=inventado')
        .expect(400)
      expect(falso.text).toContain('Não foi possível conectar')

      const state = endereco.searchParams.get('state') as string
      const ok = await anonimo
        .get(`/api/backup/google/callback?code=codigo-do-google&state=${state}`)
        .expect(200)
      expect(ok.text).toContain('Google Drive conectado!')

      // O state vale uma vez só.
      await anonimo
        .get(`/api/backup/google/callback?code=codigo-do-google&state=${state}`)
        .expect(400)

      const estado = await admin.get('/api/backup/estado').expect(200)
      expect(estado.body.google).toMatchObject({
        configurado: true,
        conectado: true,
        email: 'dono@exemplo.com',
        origemCredenciais: 'app',
      })
    })

    it('a conexão continua depois de fechar e abrir o app (como numa atualização de versão)', async () => {
      // Outra instância do servidor na mesma pasta de dados: é o que acontece quando o app
      // atualizado abre. A conexão fica em dados/integracoes/google.json, que a atualização não toca.
      // (Nos testes o banco é em memória, então a instância nova começa sem usuários.)
      const { createApp } = await import('../src/bootstrap.js')
      const reaberto = await createApp()
      await reaberto.init()
      try {
        const outro = request.agent(reaberto.getHttpServer())
        await outro.post('/api/auth/setup').send(credenciais).expect(201)
        await outro.post('/api/auth/login').send(credenciais).expect(200)
        const estado = await outro.get('/api/backup/estado').expect(200)
        expect(estado.body.google).toMatchObject({ conectado: true, email: 'dono@exemplo.com' })
      } finally {
        await reaberto.close()
      }
    })

    it('envia o backup para a pasta do Drive e limpa os mais antigos além de 30', async () => {
      for (let i = 1; i <= 31; i++) {
        google.arquivos.push({
          id: `velho-${String(i).padStart(2, '0')}-xxxxxxxx`,
          name: `brastem-2021-01-${String(i).padStart(2, '0')}-120000.sqlite.gz`,
          size: '10',
          createdTime: new Date(2021, 0, i).toISOString(),
        })
      }

      const res = await admin.post('/api/backup/executar').expect(200)
      expect(res.body.pendenteDrive).toBe(false)
      expect(res.body.ultimoEnvioDrive).not.toBeNull()
      expect(res.body.ultimoErro).toBeNull()

      const envio = google.chamadas.find((c) => c.url.includes('uploadType=multipart'))
      expect(envio?.corpo).toContain('"parents":["pasta-123456789"]')
      expect(envio?.corpo).toContain('content-type: application/gzip')

      const arquivos = (await admin.get('/api/backup/arquivos').expect(200)).body
      expect(arquivos.drive).toHaveLength(30)
      expect(
        arquivos.drive.some(
          (a: { nome: string }) => a.nome === 'brastem-2021-01-01-120000.sqlite.gz',
        ),
      ).toBe(false)
    })

    it('mantém o backup como pendente quando o Drive falha e reenvia depois', async () => {
      google.falharEnvioCom = 503
      const res = await admin.post('/api/backup/executar').expect(200)
      expect(res.body.pendenteDrive).toBe(true)
      expect(res.body.ultimoErro.mensagem).toContain(
        'Backup salvo no computador, mas o envio ao Google Drive falhou',
      )

      google.falharEnvioCom = undefined
      const { BackupService } = await import('../src/modules/backup/backup.service.js')
      await app.get(BackupService).enviarPendente()

      const depois = (await admin.get('/api/backup/estado').expect(200)).body
      expect(depois.pendenteDrive).toBe(false)
      expect(depois.ultimoErro).toBeNull()
    })

    it('só faz backup automático quando passou das 24 horas', async () => {
      const { BackupService } = await import('../src/modules/backup/backup.service.js')
      const servico = app.get(BackupService)
      const antes = arquivosLocais().length

      await servico.executarSeNecessario() // o último foi há instantes
      expect(arquivosLocais()).toHaveLength(antes)

      const estadoArquivo = join(pastaBackups, 'estado.json')
      const salvo = JSON.parse((await import('node:fs')).readFileSync(estadoArquivo, 'utf8'))
      salvo.ultimoBackup.criadoEm = new Date(Date.now() - 25 * 3600 * 1000).toISOString()
      writeFileSync(estadoArquivo, JSON.stringify(salvo))

      await servico.executarSeNecessario()
      expect((await admin.get('/api/backup/estado')).body.ultimoBackup.origem).toBe('automatico')
    })

    it('avisa para reconectar quando o Google revoga o acesso', async () => {
      await conectar()
      google.revogado = true
      // O token de acesso fica em cache por uma hora; avançamos o relógio para forçar a renovação.
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(Date.now() + 2 * 3600 * 1000)
      try {
        const { GoogleOauthService } = await import('../src/modules/backup/google-oauth.service.js')
        await expect(app.get(GoogleOauthService).tokenDeAcesso()).rejects.toThrow(
          'O acesso ao Google Drive foi revogado. Conecte de novo.',
        )
      } finally {
        vi.useRealTimers()
        google.revogado = false
      }

      const estado = (await admin.get('/api/backup/estado')).body
      expect(estado.google).toMatchObject({ configurado: true, conectado: false, email: null })
    })

    it('desconecta e pede ao Google para revogar o acesso', async () => {
      await conectar()
      google.chamadas.length = 0

      await admin.delete('/api/backup/google').expect(204)
      expect(
        google.chamadas.some((c) => c.url.startsWith('https://oauth2.googleapis.com/revoke')),
      ).toBe(true)
      const estado = (await admin.get('/api/backup/estado')).body
      expect(estado.google).toMatchObject({ configurado: true, conectado: false, email: null })
    })
  })

  describe('restauração', () => {
    const pendente = () => join(dados, 'restauracao-pendente.sqlite')

    it('prepara a troca do banco com um backup válido, sem mexer no banco em uso', async () => {
      const nome = await nomeDoUltimoBackup()

      const res = await admin
        .post('/api/backup/restaurar')
        .send({ origem: 'local', id: nome })
        .expect(200)
      expect(res.body).toEqual({ reiniciando: false }) // fora do app desktop ninguém escuta o evento
      expect(existsSync(pendente())).toBe(true)
      expect(arquivosLocais().some((n) => n.endsWith('.tmp'))).toBe(false)
      // Só o arquivo pendente na pasta de dados: nada de -wal/-shm ou .tmp sobrando da validação.
      expect(readdirSync(dados).filter((n) => n.startsWith('restauracao'))).toEqual([
        'restauracao-pendente.sqlite',
      ])

      // O sistema continua funcionando normalmente até reabrir.
      await admin.get('/api/clientes').expect(200)
      rmSync(pendente())
    })

    it('avisa o app desktop para reiniciar quando ele está escutando', async () => {
      const nome = await nomeDoUltimoBackup()
      const escuta = vi.fn()
      process.on('brastem:reiniciar', escuta)
      try {
        const res = await admin
          .post('/api/backup/restaurar')
          .send({ origem: 'local', id: nome })
          .expect(200)
        expect(res.body).toEqual({ reiniciando: true })
        expect(escuta).toHaveBeenCalledOnce()
      } finally {
        process.off('brastem:reiniciar', escuta)
        rmSync(pendente(), { force: true })
      }
    })

    /** Cópia descompactada do último backup, com o nome que o app usa antes de migrar o banco. */
    const copiaAntesDaMigracao = async () => {
      const nome = 'antes-da-migracao-2026-10-26-090000.sqlite'
      const gz = readFileSync(join(pastaBackups, await nomeDoUltimoBackup()))
      writeFileSync(join(pastaBackups, nome), gunzipSync(gz))
      return nome
    }

    it('lista e restaura a cópia que o app guarda antes de atualizar o banco', async () => {
      const nome = await copiaAntesDaMigracao()
      const lista = (await admin.get('/api/backup/arquivos').expect(200)).body.local as {
        id: string
      }[]
      expect(lista.map((a) => a.id)).toContain(nome)

      await admin.post('/api/backup/restaurar').send({ origem: 'local', id: nome }).expect(200)
      expect(existsSync(pendente())).toBe(true)
      rmSync(pendente())
      rmSync(join(pastaBackups, nome))
    })

    it('recusa backup gravado por uma versão mais nova do app', async () => {
      const nome = await copiaAntesDaMigracao()
      const banco = new Database(join(pastaBackups, nome))
      banco.exec('update __drizzle_migrations set created_at = created_at + 100000000000')
      banco.close()

      const res = await admin
        .post('/api/backup/restaurar')
        .send({ origem: 'local', id: nome })
        .expect(400)
      expect(res.body.message).toContain('versão mais nova')
      expect(existsSync(pendente())).toBe(false)
      rmSync(join(pastaBackups, nome))
    })

    describe('de um arquivo escolhido pelo usuário (R-BKP-10)', () => {
      const enviar = (conteudo: Buffer | string) =>
        admin
          .post('/api/backup/restaurar/arquivo')
          .set('content-type', 'application/octet-stream')
          .send(Buffer.from(conteudo))

      it('aceita o .sqlite.gz de um backup (do computador ou baixado do Drive)', async () => {
        const gz = readFileSync(join(pastaBackups, await nomeDoUltimoBackup()))
        const res = await enviar(gz).expect(200)
        expect(res.body).toEqual({ reiniciando: false })
        expect(existsSync(pendente())).toBe(true)
        expect(readdirSync(dados).filter((n) => n.startsWith('restauracao'))).toEqual([
          'restauracao-pendente.sqlite',
        ])
        rmSync(pendente())
      })

      it('aceita o .sqlite sem compactar (cópia antes de restaurar ou de atualizar)', async () => {
        const gz = readFileSync(join(pastaBackups, await nomeDoUltimoBackup()))
        await enviar(gunzipSync(gz)).expect(200)
        expect(existsSync(pendente())).toBe(true)
        rmSync(pendente())
      })

      it('recusa arquivo que não é backup, vazio ou de versão mais nova, sem deixar nada pendente', async () => {
        const naoBanco = await enviar('isto não é um banco').expect(400)
        expect(naoBanco.body.message).toBe(
          'Este arquivo não é um backup válido do Brastem-Service.',
        )

        const vazio = await admin
          .post('/api/backup/restaurar/arquivo')
          .set('content-type', 'application/octet-stream')
          .expect(400)
        expect(vazio.body.message).toBe('Escolha o arquivo do backup.')

        const nome = await copiaAntesDaMigracao()
        const banco = new Database(join(pastaBackups, nome))
        banco.exec('update __drizzle_migrations set created_at = created_at + 100000000000')
        banco.close()
        const novo = await enviar(readFileSync(join(pastaBackups, nome))).expect(400)
        expect(novo.body.message).toContain('versão mais nova')
        rmSync(join(pastaBackups, nome))

        expect(existsSync(pendente())).toBe(false)
        expect(readdirSync(dados).filter((n) => n.startsWith('restauracao'))).toEqual([])
      })

      it('só administrador e só como arquivo (nada de JSON)', async () => {
        const json = await admin.post('/api/backup/restaurar/arquivo').send({ id: 'x' }).expect(400)
        expect(json.body.message).toBe('Escolha o arquivo do backup.')

        await request(app.getHttpServer())
          .post('/api/backup/restaurar/arquivo')
          .set('content-type', 'application/octet-stream')
          .send(Buffer.from('x'))
          .expect(401)
      })
    })

    describe('no primeiro acesso, sem login (R-BKP-13)', () => {
      const enviarInicial = (servidor: Parameters<typeof request>[0], conteudo: Buffer) =>
        request(servidor)
          .post('/api/backup/restaurar/inicial')
          .set('content-type', 'application/octet-stream')
          .send(conteudo)

      it('com o banco ainda sem usuários, restaura um backup sem precisar entrar', async () => {
        const gz = readFileSync(join(pastaBackups, await nomeDoUltimoBackup()))
        // Outra instância, de banco vazio (nos testes o banco é em memória): é o app recém-instalado.
        const { createApp } = await import('../src/bootstrap.js')
        const novo = await createApp()
        await novo.init()
        try {
          const res = await enviarInicial(novo.getHttpServer(), gz).expect(200)
          expect(res.body).toEqual({ reiniciando: false })
          expect(existsSync(pendente())).toBe(true)
          rmSync(pendente())

          const lixo = await enviarInicial(
            novo.getHttpServer(),
            Buffer.from('não é backup'),
          ).expect(400)
          expect(lixo.body.message).toBe('Este arquivo não é um backup válido do Brastem-Service.')
          expect(existsSync(pendente())).toBe(false)
        } finally {
          await novo.close()
        }
      })

      it('depois do primeiro usuário, é recusada sem nem receber o arquivo', async () => {
        const gz = readFileSync(join(pastaBackups, await nomeDoUltimoBackup()))
        const res = await enviarInicial(app.getHttpServer(), gz).expect(403)
        expect(res.body.message).toBe(
          'Sem entrar no sistema, a restauração só pode ser feita no primeiro uso, antes de criar usuários.',
        )
        expect(existsSync(pendente())).toBe(false)
      })
    })

    describe('apagar tudo para começar do zero (R-BKP-12)', () => {
      it('pede a senha de quem está logado; errada ou vazia não prepara nada', async () => {
        const errada = await admin
          .post('/api/backup/apagar-tudo')
          .send({ senha: 'nao-e-esta' })
          .expect(403)
        expect(errada.body.message).toBe('Senha incorreta.')

        const vazia = await admin.post('/api/backup/apagar-tudo').send({}).expect(400)
        expect(vazia.body.message).toContain('O campo "senha" é obrigatório')
        expect(existsSync(pendente())).toBe(false)
      })

      it('com a senha certa, prepara um banco vazio (sem usuários) no lugar do atual', async () => {
        const res = await admin
          .post('/api/backup/apagar-tudo')
          .send({ senha: credenciais.senha })
          .expect(200)
        expect(res.body).toEqual({ reiniciando: false })

        // O banco preparado está na versão atual do app e não tem nenhum dado.
        const novo = new Database(pendente(), { readonly: true })
        try {
          for (const tabela of [
            'usuarios',
            'clientes',
            'ordens_servico',
            'pagamentos',
            'empresa',
          ]) {
            const { total } = novo.prepare(`select count(*) as total from ${tabela}`).get() as {
              total: number
            }
            expect(total, tabela).toBe(0)
          }
          const { migracoes } = novo
            .prepare('select count(*) as migracoes from __drizzle_migrations')
            .get() as { migracoes: number }
          expect(migracoes).toBeGreaterThan(0)
        } finally {
          novo.close()
        }
        expect(readdirSync(dados).filter((n) => n.startsWith('restauracao'))).toEqual([
          'restauracao-pendente.sqlite',
        ])
        // Nada muda até reabrir o app: o banco em uso continua respondendo.
        await admin.get('/api/clientes').expect(200)
        rmSync(pendente())
      })

      it('avisa o app desktop para reiniciar', async () => {
        const escuta = vi.fn()
        process.on('brastem:reiniciar', escuta)
        try {
          const res = await admin
            .post('/api/backup/apagar-tudo')
            .send({ senha: credenciais.senha })
            .expect(200)
          expect(res.body).toEqual({ reiniciando: true })
          expect(escuta).toHaveBeenCalledOnce()
        } finally {
          process.off('brastem:reiniciar', escuta)
          rmSync(pendente(), { force: true })
        }
      })
    })

    it('recusa arquivo que não é um backup do sistema, nome com caminho e arquivo inexistente', async () => {
      writeFileSync(
        join(pastaBackups, 'brastem-2022-02-02-020202.sqlite.gz'),
        'isto não é um banco',
      )
      const invalido = await admin
        .post('/api/backup/restaurar')
        .send({ origem: 'local', id: 'brastem-2022-02-02-020202.sqlite.gz' })
        .expect(400)
      expect(invalido.body.message).toBe(
        'Este arquivo não é um backup válido (não consegui descompactar).',
      )
      expect(existsSync(pendente())).toBe(false)

      const traversal = await admin
        .post('/api/backup/restaurar')
        .send({ origem: 'local', id: '../brastem.sqlite' })
        .expect(400)
      expect(traversal.body.message).toBe('Nome de backup inválido.')

      await admin
        .post('/api/backup/restaurar')
        .send({ origem: 'local', id: 'brastem-2099-01-01-000000.sqlite.gz' })
        .expect(404)
    })
  })
})
