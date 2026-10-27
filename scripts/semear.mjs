// Sobe um Brastem-Service de demonstração com dados inventados, para conferir telas e impressão sem tocar
// nos dados reais (R-TST-07). Precisa do build (`pnpm build`).
//
//   pnpm semear                  servidor em http://127.0.0.1:3334, numa pasta temporária nova
//   pnpm semear --porta 3400     outra porta
//   pnpm semear --pasta C:\x     outra pasta de dados (é apagada antes, se existir)
//
// Entra com admin / senha-de-teste-1. Ctrl+C encerra e apaga a pasta temporária.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
export const USUARIO_DEMO = { usuario: 'admin', senha: 'senha-de-teste-1' }

/** Cliente HTTP mínimo que guarda os cookies da sessão. */
export function criarApi(base) {
  let cookie = ''
  return async function api(caminho, metodo = 'GET', corpo) {
    const resposta = await fetch(base + caminho, {
      method: metodo,
      headers: { 'content-type': 'application/json', cookie },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
    const definidos = resposta.headers.getSetCookie?.() ?? []
    if (definidos.length) cookie = definidos.map((c) => c.split(';')[0]).join('; ')
    if (!resposta.ok) {
      throw new Error(`${metodo} ${caminho}: ${resposta.status} ${await resposta.text()}`)
    }
    return resposta.status === 204 ? undefined : resposta.json()
  }
}

const NOMES = ['Ana', 'Bruno', 'Álvaro', 'Carla', 'Daniel', 'Érica', 'Fábio', 'Gustavo', 'Helena']
const BAIRROS = ['Centro', 'Jardim Exemplo', 'Vila Modelo', 'Bairro Novo', 'Alto da Serra', 'Ipê']
const STATUS = ['ABERTO', 'AGUARDANDO', 'APROVADO', 'FECHADO', 'CANCELADO']

/**
 * Preenche um banco vazio: empresa, 30 clientes, 25 OS no mês de `hoje`, uma despesa e um aparelho com
 * 7 OS (para a impressão mostrar os serviços anteriores). Tudo inventado. Devolve o que foi criado.
 */
export async function semear(api, hoje = new Date().toISOString().slice(0, 10)) {
  await api('/auth/setup', 'POST', USUARIO_DEMO)
  await api('/auth/login', 'POST', USUARIO_DEMO)
  await api('/empresa', 'PUT', {
    nome: 'Assistência Exemplo',
    cnpj: '12.345.678/0001-99',
    telefone: '(31) 3000-0000',
    endereco: 'Rua Exemplo, 100 - Bairro Modelo - Cidade/UF',
    cep: '30000-000',
  })

  const aparelhos = []
  for (let i = 0; i < 30; i++) {
    const cliente = await api('/clientes', 'POST', {
      nome: `${NOMES[i % NOMES.length]} Exemplo ${i + 1}`,
      bairro: BAIRROS[i % BAIRROS.length],
      cidade: i % 3 === 0 ? 'Cidade Exemplo' : 'Vila Exemplo',
      recomendacao: ['antigo', 'indicacao', 'internet', 'porta'][i % 4],
      negativado: i === 4,
      motivo: i === 4 ? 'Cheque devolvido' : '',
      telefones: [{ nome: 'Casa', telefone: `3199999${String(1000 + i)}` }],
      aparelhos: [{ nome: i % 2 ? 'Geladeira' : 'Máquina de lavar', marca: 'Marca Exemplo' }],
    })
    aparelhos.push([cliente.id, cliente.aparelhos[0].id])
  }
  for (let i = 0; i < 25; i++) {
    const [clienteId, aparelhoId] = aparelhos[i]
    const fechada = STATUS[i % 5] === 'FECHADO'
    const valor = 10000 + i * 1500
    await api('/ordens-servico', 'POST', {
      clienteId,
      aparelhoId,
      status: STATUS[i % 5],
      valor,
      taxaDeslocamento: i % 3 === 0 ? 3000 : 0,
      abertura: hoje,
      fechamento: fechada ? hoje : undefined,
      garantiaDias: fechada ? 90 : undefined,
      isGarantia: i === 9,
      relatado: 'Não liga',
      pagamentos: fechada ? [{ valor, tipo: 'pix', parcelas: 0, data: hoje }] : undefined,
    })
  }
  await api('/transacoes', 'POST', {
    tipo: 'despesa',
    categoria: 'transporte',
    descricao: 'Combustível',
    data: hoje,
    valor: 4500,
  })

  const impressao = await api('/clientes', 'POST', {
    nome: 'Cliente Impressão Exemplo',
    cpf: '12345678901',
    email: 'cliente@exemplo.com',
    cep: '30000000',
    endereco: 'Rua das Flores',
    numero: '10',
    complemento: 'Apto 2',
    bairro: 'Centro',
    cidade: 'Cidade Exemplo',
    uf: 'MG',
    referencia: 'Perto da praça',
    telefones: [{ telefone: '31999991111' }],
    aparelhos: [{ nome: 'Geladeira', marca: 'Marca Exemplo', modelo: 'GX-44', pnc: '123456' }],
  })
  // Data de cadastro fixa: a ficha mostra essa data, e a foto da tela não pode mudar com o dia.
  await api(`/clientes/${impressao.id}`, 'PATCH', { dataCadastro: hoje })
  const ordensDoAparelho = []
  for (let i = 1; i <= 7; i++) {
    const os = await api('/ordens-servico', 'POST', {
      clienteId: impressao.id,
      aparelhoId: impressao.aparelhos[0].id,
      status: 'FECHADO',
      valor: 10000 * i,
      taxaDeslocamento: 3000,
      abertura: `2026-0${i}-05`,
      fechamento: `2026-0${i}-06`,
      garantiaDias: 90,
      relatado: `Relato ${i}`,
      identificado: `Defeito ${i}`,
      solucionado: `Solução ${i}`,
      observacao: `Observação ${i}`,
    })
    ordensDoAparelho.push(os.ordemServico.id)
  }
  return { ordemParaImprimir: ordensDoAparelho.at(-1) }
}

/** Sobe o servidor do build numa pasta de dados e espera ele responder. */
export async function subirServidor({ porta, pasta }) {
  const servidor = spawn(process.execPath, ['dist/main.js'], {
    cwd: join(RAIZ, 'apps', 'server'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: String(porta),
      DATA_DIR: pasta,
      CLIENT_DIR: join(RAIZ, 'apps', 'client', 'dist'),
      LOG_LEVEL: 'warn',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  const base = `http://127.0.0.1:${porta}/api`
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    if (servidor.exitCode !== null) throw new Error('O servidor não subiu. Rodou `pnpm build`?')
    if ((await fetch(`${base}/sistema`).catch(() => null))?.ok) return { servidor, base }
    await new Promise((resolver) => setTimeout(resolver, 500))
  }
  servidor.kill()
  throw new Error(`O servidor não respondeu em ${base}`)
}

/** Encerra o servidor e espera ele soltar o banco (no Windows, apagar a pasta antes falha). */
export function encerrarServidor(servidor) {
  if (servidor.exitCode !== null) return Promise.resolve()
  return new Promise((resolver) => {
    servidor.once('exit', resolver)
    servidor.kill()
  })
}

async function principal() {
  const { values } = parseArgs({
    options: { porta: { type: 'string', default: '3334' }, pasta: { type: 'string' } },
  })
  const temporaria = !values.pasta
  const pasta = values.pasta ?? mkdtempSync(join(tmpdir(), 'brastem-demo-'))
  if (!temporaria) rmSync(pasta, { recursive: true, force: true })

  const { servidor, base } = await subirServidor({ porta: Number(values.porta), pasta })
  const encerrar = async () => {
    await encerrarServidor(servidor)
    if (temporaria) rmSync(pasta, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    process.exit()
  }
  process.on('SIGINT', encerrar)
  try {
    const { ordemParaImprimir } = await semear(criarApi(base))
    const site = base.replace(/\/api$/, '')
    console.log(`\nDemonstração pronta em ${site} (dados em ${pasta})`)
    console.log(`Entre com ${USUARIO_DEMO.usuario} / ${USUARIO_DEMO.senha}`)
    console.log(
      `OS com 6 anteriores no aparelho: ${site}/ordens-servico/${ordemParaImprimir}/imprimir`,
    )
    console.log('Ctrl+C encerra.')
  } catch (erro) {
    console.error(erro)
    await encerrar()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await principal()
