// Sobe o servidor do build com dados inventados numa pasta temporária e guarda a sessão do admin para os
// testes de imagem. As datas são fixas para as fotos não mudarem com o dia (R-TST-06).
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  criarApi,
  encerrarServidor,
  semear,
  subirServidor,
  USUARIO_DEMO,
} from '../../../scripts/semear.mjs'

export const DIA_DOS_DADOS = '2026-10-15'

export default async function preparar() {
  const pasta = mkdtempSync(join(tmpdir(), 'brastem-visual-'))
  const { servidor, base } = await subirServidor({ porta: 3410, pasta })
  const { ordemParaImprimir } = await semear(criarApi(base), DIA_DOS_DADOS)

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(USUARIO_DEMO),
  })
  const cookies = login.headers.getSetCookie().map((linha) => {
    const [par] = linha.split(';')
    const [name, ...valor] = par.split('=')
    return {
      name,
      value: valor.join('='),
      domain: '127.0.0.1',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    }
  })
  writeFileSync(join(import.meta.dirname, '.sessao.json'), JSON.stringify({ cookies, origins: [] }))
  process.env.ORDEM_PARA_IMPRIMIR = String(ordemParaImprimir)

  return async () => {
    await encerrarServidor(servidor)
    rmSync(pasta, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}
