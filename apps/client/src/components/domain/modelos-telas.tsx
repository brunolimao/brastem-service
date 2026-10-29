import { STATUS_OS, type StatusOS } from '@brastem/shared'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { EtiquetaStatus } from '@/components/domain/etiqueta-status'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCliente } from '@/hooks/use-clientes'
import { useCaixa } from '@/hooks/use-financeiro'
import { useOrdemServico } from '@/hooks/use-ordens-servico'
import { formatarData, formatarMoeda } from '@/libs/formatters'
import { mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import type { Periodo } from '@/libs/periodo'
import { cn } from '@/libs/utils'
import type { AparelhoApi, ClienteApi } from '@/models/cliente.model'
import { type OrdemServicoListada, ROTULO_STATUS } from '@/models/ordem-servico.model'
import { ROTULO_TIPO_PAGAMENTO } from '@/models/pagamento.model'

/*
 * Pedaços de tela dos modelos em teste D · Planilha e E · Cartões (branch experimento/modelos-de-tela).
 * Usam os mesmos dados e as mesmas rotas das telas de sempre; muda só o jeito de mostrar.
 */

/** "Rua A, 10 · Centro · Cidade/UF" com o que estiver preenchido. */
const enderecoDe = (cliente: ClienteApi) =>
  [
    [cliente.endereco, cliente.numero].filter(Boolean).join(', '),
    cliente.bairro,
    [cliente.cidade, cliente.uf].filter(Boolean).join('/'),
  ]
    .filter(Boolean)
    .join(' · ')

/** Garantia do aparelho em texto e a cor da etiqueta (verde na garantia, cinza sem). */
export function garantiaDoAparelho(aparelho: AparelhoApi, hoje = new Date().toISOString()) {
  if (!aparelho.garantiaAte)
    return { texto: 'Sem garantia', classe: 'bg-muted text-muted-foreground' }
  if (aparelho.garantiaAte.slice(0, 10) >= hoje.slice(0, 10)) {
    return {
      texto: `Na garantia até ${formatarData(aparelho.garantiaAte)}`,
      classe: 'bg-chart-3/15 text-[color-mix(in_oklab,var(--chart-3),var(--foreground)_45%)]',
    }
  }
  return {
    texto: `Garantia vencida em ${formatarData(aparelho.garantiaAte)}`,
    classe: 'bg-chart-2/15 text-[color-mix(in_oklab,var(--chart-2),var(--foreground)_40%)]',
  }
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="grid content-start gap-1 rounded-sm border bg-card px-3 py-2.5 text-sm">
      <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------ D · Planilha */

/** A OS escolhida na lista, ao lado dela: dá para conferir sem abrir a ficha. */
export function PainelDaOrdem({ ordemId }: { ordemId: number | undefined }) {
  const { data, isLoading } = useOrdemServico(ordemId ?? 0)
  if (ordemId === undefined) {
    return (
      <p className="rounded-sm border border-dashed p-6 text-center text-muted-foreground text-sm">
        Clique no código de uma OS para ver os detalhes aqui.
      </p>
    )
  }
  if (isLoading || !data) return <Skeleton className="h-80 w-full" />
  const { ordemServico: os, cliente, aparelho, telefones, pagamentos } = data
  const total = os.valor + os.taxaDeslocamento
  const pago = pagamentos.reduce((soma, pagamento) => soma + pagamento.valor, 0)
  const params = { ordemId: String(os.id) }

  return (
    <aside aria-label={`OS ${os.id}`} className="grid content-start gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">
            OS {os.id} · aberta em {formatarData(os.abertura)}
          </p>
          <h2 className="font-semibold text-lg">{aparelho.nome}</h2>
        </div>
        <EtiquetaStatus status={os.status} />
      </div>
      <Bloco titulo="Cliente">
        <Link
          to="/clientes/$clienteId"
          params={{ clienteId: String(cliente.id) }}
          className={cn('font-medium hover:underline', cliente.negativado && 'text-destructive')}
        >
          {cliente.nome}
        </Link>
        {telefones.map((telefone) => (
          <span key={telefone.id} className="text-muted-foreground">
            {mascararTelefone(telefone.telefone)}
          </span>
        ))}
      </Bloco>
      <Bloco titulo="Problema">
        <span>
          <b>Relatado:</b> {os.relatado || '—'}
        </span>
        <span>
          <b>Identificado:</b> {os.identificado || '—'}
        </span>
        {os.solucionado && (
          <span>
            <b>Solucionado:</b> {os.solucionado}
          </span>
        )}
      </Bloco>
      <Bloco titulo="Valores">
        <span className="flex justify-between">
          <span>Serviço e deslocamento</span>
          <span className="tabular-nums">{formatarMoeda(total)}</span>
        </span>
        {pagamentos.map((pagamento) => (
          <span key={pagamento.id} className="flex justify-between text-muted-foreground">
            <span>
              {ROTULO_TIPO_PAGAMENTO[pagamento.tipo]} · {formatarData(pagamento.data)}
            </span>
            <span className="tabular-nums">{formatarMoeda(pagamento.valor)}</span>
          </span>
        ))}
        <span className="flex justify-between border-t pt-1 font-semibold">
          <span>Falta receber</span>
          <span className="tabular-nums">{formatarMoeda(Math.max(total - pago, 0))}</span>
        </span>
      </Bloco>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/ordens-servico/$ordemId" params={params}>
            <Pencil /> Editar
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/ordens-servico/$ordemId/imprimir" params={params}>
            <Printer /> Imprimir
          </Link>
        </Button>
      </div>
    </aside>
  )
}

/** O cliente escolhido na lista, ao lado dela. */
export function PainelDoCliente({ clienteId }: { clienteId: number | undefined }) {
  const { data: cliente, isLoading } = useCliente(clienteId)
  if (clienteId === undefined) {
    return (
      <p className="rounded-sm border border-dashed p-6 text-center text-muted-foreground text-sm">
        Clique no nome de um cliente para ver a ficha aqui.
      </p>
    )
  }
  if (isLoading || !cliente) return <Skeleton className="h-80 w-full" />

  return (
    <aside aria-label={`Ficha de ${cliente.nome}`} className="grid content-start gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">
            Cliente {cliente.id} · desde {formatarData(cliente.criadoEm)}
          </p>
          <h2 className={cn('font-semibold text-lg', cliente.negativado && 'text-destructive')}>
            {cliente.nome}
          </h2>
        </div>
        <Button asChild size="sm">
          <Link to="/clientes/$clienteId" params={{ clienteId: String(cliente.id) }}>
            <Pencil /> Abrir ficha
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Bloco titulo="Contato">
          {cliente.telefones.length === 0 && <span className="text-muted-foreground">—</span>}
          {cliente.telefones.map((telefone) => (
            <span key={telefone.id}>
              {mascararTelefone(telefone.telefone)}
              {telefone.nome && <span className="text-muted-foreground"> · {telefone.nome}</span>}
            </span>
          ))}
          {cliente.email && <span>{cliente.email}</span>}
        </Bloco>
        <Bloco titulo="Endereço">
          <span>{enderecoDe(cliente) || '—'}</span>
          {cliente.cpf && (
            <span className="text-muted-foreground">{mascararCpfCnpj(cliente.cpf)}</span>
          )}
        </Bloco>
      </div>
      <Bloco titulo="Aparelhos">
        {cliente.aparelhos.length === 0 && <span className="text-muted-foreground">Nenhum.</span>}
        {cliente.aparelhos.map((aparelho) => {
          const garantia = garantiaDoAparelho(aparelho)
          return (
            <span
              key={aparelho.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t py-1.5 first-of-type:border-t-0"
            >
              <span>
                <b>{aparelho.nome}</b>
                <span className="text-muted-foreground">
                  {[aparelho.marca, aparelho.modelo].filter(Boolean).map((parte) => ` · ${parte}`)}
                </span>
              </span>
              <span
                className={cn('rounded-full px-2 py-0.5 font-semibold text-xs', garantia.classe)}
              >
                {garantia.texto}
              </span>
              <Link
                to="/ordens-servico/nova"
                search={{ clienteId: cliente.id, aparelhoId: aparelho.id }}
                className="font-semibold text-primary text-xs"
              >
                Gerar OS
              </Link>
            </span>
          )
        })}
      </Bloco>
    </aside>
  )
}

/** Entrada e saída em colunas separadas, como num livro-caixa (D). */
export function EntradaSaida({ valor, lado }: { valor: number; lado: 'entrada' | 'saida' }) {
  if (lado === 'entrada' ? valor < 0 : valor >= 0) return null
  return (
    <span
      className={cn(
        'tabular-nums',
        lado === 'entrada'
          ? 'text-[color-mix(in_oklab,var(--chart-3),var(--foreground)_45%)]'
          : 'text-destructive',
      )}
    >
      {formatarMoeda(Math.abs(valor))}
    </span>
  )
}

/* ------------------------------------------------------------ E · Cartões */

/** Abas de status da lista de OS em cartões; "Todas" limpa o filtro. */
export function AbasDeStatus({
  atual,
  aoEscolher,
}: {
  atual: StatusOS | undefined
  aoEscolher: (status: StatusOS | undefined) => void
}) {
  const opcoes: { valor: StatusOS | undefined; rotulo: string }[] = [
    { valor: undefined, rotulo: 'Todas' },
    ...STATUS_OS.map((status) => ({ valor: status, rotulo: ROTULO_STATUS[status] })),
  ]
  return (
    <fieldset className="flex w-fit flex-wrap gap-1 rounded-2xl bg-muted p-1">
      <legend className="sr-only">Filtrar por status</legend>
      {opcoes.map((opcao) => {
        const ativa = opcao.valor === atual
        return (
          <button
            key={opcao.rotulo}
            type="button"
            aria-pressed={ativa}
            onClick={() => aoEscolher(opcao.valor)}
            className={cn(
              'min-h-10 rounded-xl px-4 font-semibold text-sm transition-colors',
              ativa ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opcao.rotulo}
          </button>
        )
      })}
    </fieldset>
  )
}

export function OrdensEmCartoes({
  ordens,
  carregando,
  vazia,
}: {
  ordens: OrdemServicoListada[]
  carregando: boolean
  vazia: ReactNode
}) {
  if (carregando) return <Skeleton className="h-64 w-full" />
  if (ordens.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-12 text-muted-foreground">{vazia}</div>
    )
  }
  return (
    <section aria-label="Ordens de serviço" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ordens.map((os) => (
        <article key={os.id} className="grid gap-3 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-muted-foreground text-sm">OS {os.id}</span>
            <EtiquetaStatus status={os.status} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">{os.aparelhoNome}</h2>
            <Link
              to="/clientes/$clienteId"
              params={{ clienteId: String(os.clienteId) }}
              className={cn(
                'hover:underline',
                os.clienteNegativado ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {os.clienteNome}
            </Link>
          </div>
          <div className="flex items-baseline justify-between text-muted-foreground text-sm">
            <span>Aberta em {formatarData(os.abertura)}</span>
            <b className="text-base text-foreground tabular-nums">
              {formatarMoeda(os.valor + os.taxaDeslocamento)}
            </b>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="lg" className="flex-1">
              <Link to="/ordens-servico/$ordemId" params={{ ordemId: String(os.id) }}>
                Abrir
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon-lg" aria-label={`Imprimir OS ${os.id}`}>
              <Link to="/ordens-servico/$ordemId/imprimir" params={{ ordemId: String(os.id) }}>
                <Printer />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}

/** Aparelhos do cliente em cartões, cada um com a garantia e o atalho para a nova OS (E). */
export function AparelhosEmCartoes({
  clienteId,
  aparelhos,
}: {
  clienteId: number
  aparelhos: AparelhoApi[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {aparelhos.length === 0 && (
        <p className="text-muted-foreground">Nenhum aparelho. Cadastre em "Dados e endereço".</p>
      )}
      {aparelhos.map((aparelho) => {
        const garantia = garantiaDoAparelho(aparelho)
        return (
          <article
            key={aparelho.id}
            className="grid content-start gap-3 rounded-2xl border bg-card p-5"
          >
            <div>
              <h3 className="font-extrabold text-lg">{aparelho.nome}</h3>
              <p className="text-muted-foreground text-sm">
                {[aparelho.marca, aparelho.modelo].filter(Boolean).join(' · ') || 'Sem detalhes'}
              </p>
            </div>
            <span className={cn('w-fit rounded-full px-3 py-1 font-bold text-xs', garantia.classe)}>
              {garantia.texto}
            </span>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link to="/ordens-servico/nova" search={{ clienteId, aparelhoId: aparelho.id }}>
                  <Plus /> Nova OS
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/ordens-servico" search={{ aparelhoId: aparelho.id }}>
                  Ver OS
                </Link>
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

/** Cabeçalho da ficha do cliente em cartão, com as iniciais (E). */
export function CabecalhoDoCliente({
  cliente,
}: {
  cliente: ClienteApi & { telefones: { telefone: string }[] }
}) {
  const iniciais = cliente.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-2xl border bg-card p-6">
      <span
        aria-hidden
        className="flex size-16 items-center justify-center rounded-full bg-accent font-extrabold text-primary text-xl"
      >
        {iniciais}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className={cn('font-extrabold text-2xl', cliente.negativado && 'text-destructive')}>
          {cliente.nome}
        </h1>
        <p className="text-muted-foreground">
          {[
            cliente.telefones[0] && mascararTelefone(cliente.telefones[0].telefone),
            enderecoDe(cliente),
          ]
            .filter(Boolean)
            .join(' · ') || 'Sem telefone nem endereço'}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          Cliente {cliente.id} · desde {formatarData(cliente.criadoEm)}
        </p>
      </div>
    </section>
  )
}

/** Abas simples (botões); o conteúdo de cada uma fica com quem usa. */
export function Abas<T extends string>({
  rotulo,
  abas,
  atual,
  aoEscolher,
}: {
  rotulo: string
  abas: { valor: T; rotulo: string }[]
  atual: T
  aoEscolher: (valor: T) => void
}) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className="flex w-fit flex-wrap gap-1 rounded-2xl bg-muted p-1"
    >
      {abas.map((aba) => {
        const ativa = aba.valor === atual
        return (
          <button
            key={aba.valor}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => aoEscolher(aba.valor)}
            className={cn(
              'min-h-10 rounded-xl px-4 font-semibold text-sm transition-colors',
              ativa ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </div>
  )
}

/** Até 100 lançamentos por pedido (o limite da API): o gráfico avisa quando o período tem mais. */
const LIMITE_DO_GRAFICO = 100

/** Entradas e saídas por semana do período (E): barras lado a lado, com os valores no balão. */
export function GraficoSemanal({ periodo }: { periodo: Periodo }) {
  const { data, isLoading } = useCaixa(periodo, {
    page: 1,
    pageSize: LIMITE_DO_GRAFICO,
    ordem: 'data',
    direcao: 'asc',
  })
  if (isLoading || !data) return <Skeleton className="h-56 w-full" />

  const semanas = new Map<string, { entrada: number; saida: number }>()
  for (const item of data.itens) {
    const dia = Number(item.data.slice(8, 10))
    const chave = `${item.data.slice(0, 7)}-${Math.min(Math.ceil(dia / 7), 5)}`
    const semana = semanas.get(chave) ?? { entrada: 0, saida: 0 }
    if (item.valor >= 0) semana.entrada += item.valor
    else semana.saida -= item.valor
    semanas.set(chave, semana)
  }
  const lista = [...semanas.entries()].map(([chave, valores]) => {
    const [ano, mes, semana] = chave.split('-')
    return { rotulo: `${semana}ª sem. ${mes}/${ano?.slice(2)}`, ...valores }
  })
  const maior = Math.max(1, ...lista.flatMap((semana) => [semana.entrada, semana.saida]))

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold text-lg">Entradas e saídas por semana</h2>
        <div className="flex gap-4 font-semibold text-sm">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded bg-primary" /> Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded bg-destructive" /> Saídas
          </span>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma movimentação neste período.</p>
      ) : (
        <ul
          aria-label="Entradas e saídas por semana"
          className="flex h-48 items-end gap-4 border-b pb-1"
        >
          {lista.map((semana) => (
            <li key={semana.rotulo} className="grid h-full flex-1 grid-rows-[1fr_auto] gap-1">
              <div className="flex items-end justify-center gap-1.5">
                <div
                  className="w-1/3 max-w-10 rounded-t-lg bg-primary"
                  style={{ height: `${(semana.entrada / maior) * 100}%` }}
                />
                <div
                  className="w-1/3 max-w-10 rounded-t-lg bg-destructive"
                  style={{ height: `${(semana.saida / maior) * 100}%` }}
                />
              </div>
              <span className="text-center text-muted-foreground text-xs">{semana.rotulo}</span>
              <span className="sr-only">
                Entradas {formatarMoeda(semana.entrada)}, saídas {formatarMoeda(semana.saida)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data.quantidade > LIMITE_DO_GRAFICO && (
        <p className="text-muted-foreground text-xs">
          O gráfico usa as {LIMITE_DO_GRAFICO} primeiras de {data.quantidade} movimentações do
          período.
        </p>
      )}
    </section>
  )
}
