import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { formatarData } from '@/libs/formatters'
import { mascararTelefone } from '@/libs/masks'
import type { AparelhoApi, ClienteApi, TelefoneApi } from '@/models/cliente.model'

interface ResumoOrdemProps {
  cliente: Pick<ClienteApi, 'id' | 'nome' | 'negativado' | 'motivo'>
  aparelho: AparelhoApi
  telefones?: Pick<TelefoneApi, 'telefone' | 'nome'>[]
}

/** Quem é o cliente e qual é o aparelho da OS, sempre visível acima do formulário. */
export function ResumoOrdem({ cliente, aparelho, telefones = [] }: ResumoOrdemProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1">
          <p className="text-muted-foreground text-xs uppercase">Cliente</p>
          <Link
            to="/clientes/$clienteId"
            params={{ clienteId: String(cliente.id) }}
            className={`font-medium hover:underline ${cliente.negativado ? 'text-destructive' : ''}`}
          >
            {cliente.nome}
          </Link>
          {cliente.negativado && (
            <p className="text-destructive text-sm">
              Negativado{cliente.motivo && `: ${cliente.motivo}`}
            </p>
          )}
          {telefones.map((telefone) => (
            <p key={telefone.telefone} className="text-muted-foreground text-sm">
              {mascararTelefone(telefone.telefone)}
              {telefone.nome && ` (${telefone.nome})`}
            </p>
          ))}
        </div>
        <div className="grid gap-1">
          <p className="text-muted-foreground text-xs uppercase">Aparelho</p>
          <p className="font-medium">{aparelho.nome}</p>
          <p className="text-muted-foreground text-sm">
            {[aparelho.marca, aparelho.modelo, aparelho.pnc && `PNC ${aparelho.pnc}`]
              .filter(Boolean)
              .join(' · ') || 'Sem detalhes'}
          </p>
          {aparelho.garantiaAte && (
            <p className="text-muted-foreground text-sm">
              Garantia do serviço até {formatarData(aparelho.garantiaAte)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
