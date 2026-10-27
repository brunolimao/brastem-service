import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TransacaoFormulario } from '@/components/domain/transacao-form'
import { PageHeader } from '@/components/layout/page-header'
import { useCriarTransacao } from '@/hooks/use-financeiro'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { useSessionStore } from '@/hooks/use-session-store'
import { formParaPayloadTransacao } from '@/models/transacao.model'

export const Route = createFileRoute('/_app/caixa/despesa')({ component: DespesaPage })

function DespesaPage() {
  const navigate = useNavigate()
  const criar = useCriarTransacao('Despesa')
  // Só administrador enxerga o caixa; os demais voltam para o início.
  const destino = () => (useSessionStore.getState().usuario?.role === 'admin' ? '/caixa' : '/')

  return (
    <>
      <PageHeader
        titulo="Lançar despesa"
        descricao="Peça, transporte, material ou outra saída. Entra negativa no caixa."
      />
      <TransacaoFormulario
        tipo="despesa"
        aoCancelar={() => navigate({ to: destino(), search: buscaLembrada(destino()) })}
        aoSalvar={async (valores) => {
          await criar.mutateAsync(formParaPayloadTransacao('despesa', valores))
          await navigate({ to: destino(), search: buscaLembrada(destino()) })
        }}
      />
    </>
  )
}
