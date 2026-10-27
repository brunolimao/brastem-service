import type { CSSProperties } from 'react'
import { centavosParaReais, formatarData } from '@/libs/formatters'
import { mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import type { Empresa } from '@/models/empresa.model'
import type { OrdemServicoDetalhe } from '@/models/ordem-servico.model'

/*
 * Cópia da OS impressa do sistema antigo (R-IMP-03): a mesma folha de 2480 × 3508 px (A4 a 300 dpi), com as
 * mesmas posições, tamanhos e fonte ('Inter', sem alternativa, como lá). Na tela e no papel ela é reduzida
 * para a largura de um A4.
 */
const LARGURA = 2480
const ALTURA = 3508
/** 210 mm em px do CSS (96 por polegada) dividido pela largura da folha antiga. */
const ESCALA = ((210 / 25.4) * 96) / LARGURA

const ROTULO: CSSProperties = { fontSize: 40, fontWeight: 600 }
const VALOR: CSSProperties = { fontSize: 36, fontWeight: 400 }
const TITULO: CSSProperties = { position: 'absolute', fontSize: 48, fontWeight: 700 }
const CABECALHO: CSSProperties = {
  position: 'absolute',
  left: 700,
  width: 1779,
  fontSize: 36,
  fontWeight: 400,
  textAlign: 'center',
}

interface Posicao {
  left: number
  top: number
  width: number
}

function Campo({ rotulo, valor, ...posicao }: Posicao & { rotulo: string; valor: string }) {
  return (
    <div style={{ position: 'absolute', wordWrap: 'break-word', ...posicao }}>
      <span style={ROTULO}>{rotulo} </span>
      <span style={VALOR}>{valor}</span>
    </div>
  )
}

function Linha({ left, top }: { left: number; top: number }) {
  return (
    <div
      style={{ position: 'absolute', left, top, width: 2300, height: 0, border: '3px black solid' }}
    />
  )
}

/** Colunas dos últimos serviços: posição do título e do valor, como no antigo. */
const COLUNAS = [
  { titulo: 'OS:', esquerda: 0, largura: 217.22, esquerdaValor: 0, larguraValor: 220.17 },
  { titulo: 'Abertura:', esquerda: 217, largura: 247, esquerdaValor: 220, larguraValor: 244 },
  { titulo: 'Valor:', esquerda: 488, largura: 248, esquerdaValor: 488, larguraValor: 248 },
  {
    titulo: 'Serviço:',
    esquerda: 749.96,
    largura: 229.02,
    esquerdaValor: 752.91,
    larguraValor: 229.02,
  },
  {
    titulo: 'Fechamento:',
    esquerda: 979.96,
    largura: 406.92,
    esquerdaValor: 982,
    larguraValor: 249,
  },
  {
    titulo: 'Prob. solucionado:',
    esquerda: 1294,
    largura: 760,
    esquerdaValor: 1294,
    larguraValor: 760,
  },
  { titulo: 'Garantia:', esquerda: 2054, largura: 246, esquerdaValor: 2054, larguraValor: 240 },
] as const

const reais = (centavos: number) => centavosParaReais(centavos)
const data = (iso: string | null) => (iso ? formatarData(iso) : '')

export function PrintOSAntigo({
  detalhe,
  empresa,
}: {
  detalhe: OrdemServicoDetalhe
  empresa: Empresa
}) {
  const { ordemServico: os, cliente, aparelho, telefones, ultimasOrdens } = detalhe
  // O antigo listava as 5 OS mais novas do aparelho, contando a que está sendo impressa.
  const ultimas = ultimasOrdens.slice(0, 5)
  const telefone = telefones[0] ? mascararTelefone(telefones[0].telefone) : ''
  // Os dados da empresa vêm de Configurações (no antigo estavam escritos no código); só o preenchido aparece.
  const contatos = [
    empresa.cep && `CEP: ${empresa.cep}`,
    empresa.telefone && `Fone: ${empresa.telefone}`,
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <article
      aria-label="Ordem de serviço (modelo antigo)"
      className="mx-auto overflow-hidden bg-white shadow-sm print:shadow-none"
      style={{ width: '210mm', height: '290mm' }}
    >
      <style>{'@page { size: A4; margin: 0; }'}</style>
      <div
        style={{
          width: LARGURA,
          height: ALTURA,
          position: 'relative',
          background: 'white',
          color: 'black',
          fontFamily: 'Inter',
          transform: `scale(${ESCALA})`,
          transformOrigin: 'top left',
        }}
      >
        <img
          src="/logo.jpg"
          alt="logo"
          style={{
            position: 'absolute',
            left: 84,
            top: 29,
            width: 408.89,
            height: 230,
            objectFit: 'contain',
          }}
        />
        <div style={{ ...CABECALHO, top: 46, fontSize: 48, fontWeight: 700 }}>
          {empresa.nome || 'Brastem-Service'}
        </div>
        {empresa.endereco && <div style={{ ...CABECALHO, top: 104 }}>{empresa.endereco}</div>}
        {contatos && <div style={{ ...CABECALHO, top: 148 }}>{contatos}</div>}
        {empresa.cnpj && <div style={{ ...CABECALHO, top: 195 }}>CNPJ: {empresa.cnpj}</div>}

        <Linha left={80} top={275} />
        <div style={{ ...TITULO, left: 1037, top: 275, width: 406 }}>Dados do cliente</div>
        <Campo rotulo="Código:" valor={String(cliente.id)} left={80} top={340} width={424} />
        <Campo rotulo="Nome:" valor={cliente.nome} left={517} top={340} width={1241} />
        <Campo
          rotulo="CPF/CNPJ:"
          valor={cliente.cpf ? mascararCpfCnpj(cliente.cpf) : ''}
          left={1758}
          top={340}
          width={622}
        />
        <Campo rotulo="Email:" valor={cliente.email} left={80} top={404} width={1457} />
        <Campo rotulo="Telefone:" valor={telefone} left={1006} top={405} width={752} />
        <Campo rotulo="CEP:" valor={cliente.cep} left={1758} top={404} width={622} />
        <Campo rotulo="End.:" valor={cliente.endereco} left={80} top={470} width={1098} />
        <Campo rotulo="Nº.:" valor={cliente.numero} left={1194} top={470} width={332} />
        <Campo rotulo="Compl.:" valor={cliente.complemento} left={1524} top={470} width={849} />
        <Campo rotulo="Bairro:" valor={cliente.bairro} left={80} top={536} width={916} />
        <Campo rotulo="Cidade:" valor={cliente.cidade} left={1006} top={536} width={1075} />
        <Campo rotulo="UF:" valor={cliente.uf} left={2089} top={536} width={281} />
        {/* No antigo este campo saía sempre vazio (lia um campo que não existia); aqui sai a referência. */}
        <Campo
          rotulo="Referência/Observação:"
          valor={cliente.referencia}
          left={80}
          top={602}
          width={2290}
        />

        <Linha left={82} top={670} />
        <div style={{ ...TITULO, left: 1086, top: 666, width: 304 }}>Dados da OS</div>
        <Campo rotulo="Código OS:" valor={String(os.id)} left={82} top={731} width={600} />
        <Campo
          rotulo="Data de abertura:"
          valor={data(os.abertura)}
          left={627}
          top={731}
          width={863}
        />
        <Campo rotulo="Status:" valor={os.status} left={1524} top={731} width={827} />
        <Campo rotulo="Valor:" valor={reais(os.valor)} left={84} top={796} width={504} />
        <Campo
          rotulo="Taxa de serviço:"
          valor={reais(os.taxaDeslocamento)}
          left={627}
          top={796}
          width={756}
        />
        <Campo
          rotulo="Garantia:"
          valor={data(aparelho.garantiaAte)}
          left={1524}
          top={796}
          width={854}
        />
        <Campo rotulo="Observação OS:" valor={os.observacao} left={82} top={861} width={2292} />
        <Campo
          rotulo="Código aparelho:"
          valor={String(aparelho.ordem)}
          left={80}
          top={925}
          width={551}
        />
        <Campo rotulo="Nome:" valor={aparelho.nome} left={684} top={925} width={944} />
        <Campo rotulo="Marca:" valor={aparelho.marca} left={1758} top={925} width={724} />
        <Campo rotulo="Modelo:" valor={aparelho.modelo} left={84} top={989} width={736} />
        <Campo rotulo="PNC:" valor={aparelho.pnc} left={682} top={989} width={733} />
        <Campo rotulo="Problema relatado:" valor={os.relatado} left={82} top={1053} width={2292} />
        <Campo
          rotulo="Problema identificado:"
          valor={os.identificado}
          left={82}
          top={1117}
          width={2289}
        />
        <Campo
          rotulo="Observação aparelho:"
          valor={aparelho.observacao}
          left={80}
          top={1175}
          width={2289}
        />

        <Linha left={84} top={1233} />
        <div style={{ ...TITULO, left: 832, top: 1241, width: 816 }}>
          Últimos 5 serviços nesse aparelho
        </div>
        <div style={{ position: 'absolute', left: 86, top: 1309, width: 2300, height: 49 }}>
          {COLUNAS.map((coluna) => (
            <div
              key={coluna.titulo}
              style={{
                ...ROTULO,
                position: 'absolute',
                left: coluna.esquerda,
                top: 0,
                width: coluna.largura,
              }}
            >
              {coluna.titulo}
            </div>
          ))}
        </div>
        {ultimas.map((ordem, indice) => {
          const valores = [
            String(ordem.id),
            data(ordem.abertura),
            reais(ordem.valor),
            reais(ordem.taxaDeslocamento),
            data(ordem.fechamento),
            ordem.solucionado,
            ordem.garantiaDias === null ? '' : String(ordem.garantiaDias),
          ]
          return (
            <div
              key={ordem.id}
              data-testid="ultimo-servico"
              style={{
                position: 'absolute',
                left: 92.95,
                top: 1369 + indice * 56,
                width: 2294.1,
                height: 59,
              }}
            >
              {COLUNAS.map((coluna, posicao) => (
                <div
                  key={coluna.titulo}
                  style={{
                    ...VALOR,
                    position: 'absolute',
                    left: coluna.esquerdaValor,
                    top: 0,
                    width: coluna.larguraValor,
                    wordWrap: 'break-word',
                  }}
                >
                  {valores[posicao]}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </article>
  )
}
