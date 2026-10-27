import { Link } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useEstadoBackup } from '@/hooks/use-backup'
import { avisoDeBackup } from '@/models/backup.model'

/** Aviso no Início quando o backup está atrasado ou parado (R-BKP-14). Só para o administrador. */
export function AvisoBackup() {
  const { data } = useEstadoBackup()
  const aviso = data ? avisoDeBackup(data) : null
  if (!aviso) return null

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{aviso.titulo}</AlertTitle>
      <AlertDescription>
        <p>{aviso.descricao}</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link to="/configuracoes">Ver o backup em Configurações</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
