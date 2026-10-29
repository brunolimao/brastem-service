import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ListChecks } from 'lucide-react'
import { useState } from 'react'
import { ClienteFormulario } from '@/components/domain/cliente-form'
import {
  Abas,
  AparelhosEmCartoes,
  CabecalhoDoCliente,
  OrdensEmCartoes,
} from '@/components/domain/modelos-telas'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtualizarCliente, useCliente } from '@/hooks/use-clientes'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { useOrdensServico } from '@/hooks/use-ordens-servico'
import { useRegistrarRecente } from '@/hooks/use-recentes'
import { useThemeStore } from '@/hooks/use-theme-store'
import { formatarData } from '@/libs/formatters'
import { cn } from '@/libs/utils'
import { clienteParaForm, formParaPayloadCliente } from '@/models/cliente.model'

export const Route = createFileRoute('/_app/clientes/$clienteId')({ component: EditarClientePage })

function EditarClientePage() {
  const clienteId = Number(Route.useParams().clienteId)
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(clienteId)
  const atualizar = useAtualizarCliente(clienteId)
  // E · Cartões (em teste): ficha em abas. O formulário fica montado nas outras abas (só escondido),
  // para não perder o que foi digitado ao trocar de aba.
  const cartoes = useThemeStore((estado) => estado.modelo) === 'cartoes'
  const [aba, setAba] = useState<AbaDaFicha>('aparelhos')
  useRegistrarRecente(
    cliente && {
      tipo: 'cliente',
      id: cliente.id,
      titulo: cliente.nome,
      detalhe: `Código ${cliente.id}`,
    },
  )

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!cliente) return <PageHeader titulo="Cliente não encontrado" />

  const formulario = (
    // A `key` refaz o formulário quando o cliente é recarregado depois de salvar.
    <ClienteFormulario
      key={`${cliente.id}-${cliente.telefones.length}-${cliente.aparelhos.map((a) => a.id).join(',')}`}
      valoresIniciais={clienteParaForm(cliente)}
      clienteId={cliente.id}
      aoCancelar={() => navigate({ to: '/clientes', search: buscaLembrada('/clientes') })}
      aoSalvar={(valores) => atualizar.mutateAsync(formParaPayloadCliente(valores))}
    />
  )

  if (cartoes) {
    return (
      <>
        <CabecalhoDoCliente cliente={cliente} />
        <Abas rotulo="Partes da ficha" abas={ABAS_DA_FICHA} atual={aba} aoEscolher={setAba} />
        {aba === 'aparelhos' && (
          <AparelhosEmCartoes clienteId={cliente.id} aparelhos={cliente.aparelhos} />
        )}
        {aba === 'historico' && <HistoricoDoCliente clienteId={cliente.id} />}
        <div className={cn(aba !== 'dados' && 'hidden')}>{formulario}</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        titulo={cliente.nome}
        descricao={`Código ${cliente.id} · cadastrado em ${formatarData(cliente.criadoEm)}`}
        acoes={
          <Button asChild variant="outline">
            <Link to="/ordens-servico" search={{ clienteId }}>
              <ListChecks /> Ver todas as OS
            </Link>
          </Button>
        }
      />
      {formulario}
    </>
  )
}

type AbaDaFicha = 'aparelhos' | 'dados' | 'historico'

const ABAS_DA_FICHA: { valor: AbaDaFicha; rotulo: string }[] = [
  { valor: 'aparelhos', rotulo: 'Aparelhos' },
  { valor: 'dados', rotulo: 'Dados e endereço' },
  { valor: 'historico', rotulo: 'Histórico de OS' },
]

function HistoricoDoCliente({ clienteId }: { clienteId: number }) {
  const { data, isLoading } = useOrdensServico({
    clienteId,
    page: 1,
    pageSize: 12,
    ordem: 'abertura',
    direcao: 'desc',
  })
  return (
    <OrdensEmCartoes
      ordens={data?.items ?? []}
      carregando={isLoading}
      vazia={<span>Nenhuma ordem de serviço deste cliente ainda.</span>}
    />
  )
}
