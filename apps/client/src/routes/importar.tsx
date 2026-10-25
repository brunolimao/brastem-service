import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatarMoeda } from '@/libs/formatters'
import { ROTULO_TABELA } from '@/models/importacao.model'
import { authService } from '@/services/auth.service'
import { importacaoService } from '@/services/importacao.service'

export const Route = createFileRoute('/importar')({
  beforeLoad: async () => {
    const { needsSetup } = await authService.precisaConfigurar()
    if (!needsSetup) throw redirect({ to: '/login' })
  },
  component: ImportarPage,
})

function ImportarPage() {
  const navigate = useNavigate()
  const seletor = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const importar = useMutation({ mutationFn: importacaoService.importarLegado })
  const resultado = importar.data

  // Se o arquivo trouxe usuários, o sistema já pode ser usado; senão ainda falta criar o administrador.
  const proximo = async () => {
    const { needsSetup } = await authService.precisaConfigurar()
    await navigate({ to: needsSetup ? '/primeiro-acesso' : '/login' })
  }

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center gap-3 text-center">
          <img src="/logo.jpg" alt="Brastem-Service" className="h-24 object-contain" />
          <CardTitle>Importar dados do sistema antigo</CardTitle>
          <CardDescription>
            Escolha o arquivo <strong>.sql</strong> gerado pelo mysqldump. Clientes, ordens de
            serviço, pagamentos e usuários vêm juntos, e as senhas antigas continuam valendo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {!resultado ? (
            <>
              <input
                ref={seletor}
                type="file"
                accept=".sql,text/plain"
                className="sr-only"
                aria-label="Arquivo .sql do sistema antigo"
                onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => seletor.current?.click()}>
                <FileUp /> {arquivo ? arquivo.name : 'Escolher arquivo'}
              </Button>
              {arquivo && (
                <p className="text-center text-muted-foreground text-sm">
                  {(arquivo.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
              <div className="flex justify-between gap-2">
                <Button asChild variant="ghost">
                  <Link to="/primeiro-acesso">Voltar</Link>
                </Button>
                <Button
                  disabled={!arquivo || importar.isPending}
                  onClick={() => arquivo && importar.mutate(arquivo)}
                >
                  {importar.isPending ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-5" /> Importação concluída
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dados</TableHead>
                    <TableHead className="text-right">No arquivo</TableHead>
                    <TableHead className="text-right">Importados</TableHead>
                    <TableHead className="text-right">Ignorados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultado.tabelas).map(([tabela, resumo]) => (
                    <TableRow key={tabela}>
                      <TableCell>{ROTULO_TABELA[tabela] ?? tabela}</TableCell>
                      <TableCell className="text-right">{resumo.lidos}</TableCell>
                      <TableCell className="text-right">{resumo.importados}</TableCell>
                      <TableCell className="text-right">{resumo.ignorados}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valor das ordens de serviço</dt>
                  <dd>{formatarMoeda(resultado.totais.ordensServico)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Soma dos pagamentos</dt>
                  <dd>{formatarMoeda(resultado.totais.pagamentos)}</dd>
                </div>
              </dl>
              {resultado.avisos.length > 0 && (
                <div className="grid gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="size-4" /> Avisos
                  </p>
                  <ul className="list-disc pl-5">
                    {resultado.avisos.map((aviso) => (
                      <li key={aviso}>{aviso}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={proximo}>Continuar</Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
