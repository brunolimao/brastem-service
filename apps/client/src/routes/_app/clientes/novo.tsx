import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteFormulario } from '@/components/domain/cliente-form'
import { PageHeader } from '@/components/layout/page-header'
import { useCriarCliente } from '@/hooks/use-clientes'
import { buscaLembrada } from '@/hooks/use-listas-lembradas'
import { clienteVazio, formParaPayloadCliente } from '@/models/cliente.model'

export const Route = createFileRoute('/_app/clientes/novo')({ component: NovoClientePage })

function NovoClientePage() {
  const navigate = useNavigate()
  const criar = useCriarCliente()

  return (
    <>
      <PageHeader titulo="Cadastrar cliente" />
      <ClienteFormulario
        valoresIniciais={clienteVazio()}
        aoCancelar={() => navigate({ to: '/clientes', search: buscaLembrada('/clientes') })}
        aoSalvar={async (valores) => {
          const cliente = await criar.mutateAsync(formParaPayloadCliente(valores))
          // Vai para a edição, onde os aparelhos já salvos ganham os atalhos de OS.
          await navigate({ to: '/clientes/$clienteId', params: { clienteId: String(cliente.id) } })
        }}
      />
    </>
  )
}
