import { LifeBuoy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGerarDiagnostico } from '@/hooks/use-sistema'

/** "Gerar diagnóstico" para o suporte, só para o administrador (R-CFG-10). */
export function DiagnosticoCard() {
  const gerar = useGerarDiagnostico()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suporte</CardTitle>
        <CardDescription>
          Se algo der errado, gere o diagnóstico e envie o arquivo para o suporte. Ele leva a
          versão, a situação do banco e do backup e os registros dos últimos dias, sem dados de
          clientes nem senhas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => gerar.mutate()} disabled={gerar.isPending}>
          <LifeBuoy /> {gerar.isPending ? 'Gerando...' : 'Gerar diagnóstico'}
        </Button>
      </CardContent>
    </Card>
  )
}
