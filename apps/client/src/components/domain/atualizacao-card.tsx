import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProcurarAtualizacao, useVersao } from '@/hooks/use-sistema'

/** Versão instalada e "Procurar atualização", para todos os usuários (R-ATU-11). */
export function AtualizacaoCard() {
  const { data: versao } = useVersao()
  const procurar = useProcurarAtualizacao()
  const desenvolvimento = versao === 'desenvolvimento'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualizações</CardTitle>
        <CardDescription>
          O sistema procura atualização sozinho ao abrir e a cada 4 horas. Use o botão para procurar
          agora.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <p className="text-sm">
          {desenvolvimento ? 'Versão de desenvolvimento' : `Versão instalada: ${versao ?? '...'}`}
        </p>
        {versao && !desenvolvimento && (
          <Button variant="outline" onClick={() => procurar.mutate()} disabled={procurar.isPending}>
            <RefreshCw /> Procurar atualização
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
