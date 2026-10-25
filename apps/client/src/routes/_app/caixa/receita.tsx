import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TransacaoFormulario } from '@/components/domain/transacao-form'
import { PageHeader } from '@/components/layout/page-header'
import { useCriarTransacao } from '@/hooks/use-financeiro'
import { useSessionStore } from '@/hooks/use-session-store'
import { formParaPayloadTransacao } from '@/models/transacao.model'

export const Route = createFileRoute('/_app/caixa/receita')({ component: ReceitaPage })

function ReceitaPage() {
  const navigate = useNavigate()
  const criar = useCriarTransacao('Receita')
  // Só administrador enxerga o caixa; os demais voltam para o início.
  const destino = () => (useSessionStore.getState().usuario?.role === 'admin' ? '/caixa' : '/')

  return (
    <>
      <PageHeader titulo="Lançar receita" descricao="Venda, gorjeta ou outra entrada avulsa." />
      <TransacaoFormulario
        tipo="receita"
        aoCancelar={() => navigate({ to: destino() })}
        aoSalvar={async (valores) => {
          await criar.mutateAsync(formParaPayloadTransacao('receita', valores))
          await navigate({ to: destino() })
        }}
      />
    </>
  )
}
