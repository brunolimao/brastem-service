import { formatarData, formatarMoeda } from '@/libs/formatters'
import { mascararCpfCnpj, mascararTelefone } from '@/libs/masks'
import type { Empresa } from '@/models/empresa.model'
import {
  type OrdemServicoDetalhe,
  ROTULO_STATUS,
  servicosAnteriores,
} from '@/models/ordem-servico.model'
import { ROTULO_TIPO_PAGAMENTO } from '@/models/pagamento.model'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 break-inside-avoid">
      <h2 className="border-b border-neutral-800 pb-1 font-semibold text-sm uppercase tracking-wide">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Dado({
  rotulo,
  valor,
  className,
}: {
  rotulo: string
  valor?: string | null
  className?: string
}) {
  return (
    <p className={className}>
      <span className="text-neutral-600">{rotulo}: </span>
      {valor || '—'}
    </p>
  )
}

/** Folha A4 da ordem de serviço. Sempre clara, mesmo no tema escuro, porque é feita para o papel. */
export function PrintOS({ detalhe, empresa }: { detalhe: OrdemServicoDetalhe; empresa: Empresa }) {
  const { ordemServico: os, cliente, aparelho, telefones, pagamentos, ultimasOrdens } = detalhe
  // Só o que foi preenchido nas configurações aparece no papel.
  const contatos = [
    empresa.cep && `CEP ${empresa.cep}`,
    empresa.telefone && `Fone ${empresa.telefone}`,
  ].filter(Boolean)
  const anteriores = servicosAnteriores(ultimasOrdens, os.id)
  const endereco = [cliente.endereco, cliente.numero && `nº ${cliente.numero}`, cliente.complemento]
    .filter(Boolean)
    .join(', ')

  return (
    <article className="mx-auto grid max-w-[210mm] gap-5 bg-white p-8 text-neutral-900 text-sm shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-center gap-5 border-neutral-800 border-b-2 pb-4">
        <img src="/logo.jpg" alt="" className="h-24 object-contain" />
        <div className="grid gap-0.5 text-xs">
          <p className="font-bold text-lg">{empresa.nome || 'Brastem-Service'}</p>
          {empresa.endereco && <p>{empresa.endereco}</p>}
          {contatos.length > 0 && <p>{contatos.join(' · ')}</p>}
          {empresa.cnpj && <p>CNPJ {empresa.cnpj}</p>}
        </div>
        <div className="ml-auto text-right">
          <p className="text-neutral-600 text-xs uppercase">Ordem de serviço</p>
          <p className="font-bold text-2xl">Nº {os.id}</p>
        </div>
      </header>

      <Secao titulo="Dados do cliente">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <Dado rotulo="Código" valor={String(cliente.id)} />
          <Dado rotulo="Nome" valor={cliente.nome} />
          <Dado rotulo="CPF/CNPJ" valor={cliente.cpf && mascararCpfCnpj(cliente.cpf)} />
          <Dado rotulo="E-mail" valor={cliente.email} />
          <Dado
            rotulo="Telefone"
            valor={telefones.map((t) => mascararTelefone(t.telefone)).join(' / ')}
          />
          <Dado rotulo="CEP" valor={cliente.cep} />
          <Dado rotulo="Endereço" valor={endereco} className="col-span-2" />
          <Dado rotulo="Bairro" valor={cliente.bairro} />
          <Dado
            rotulo="Cidade/UF"
            valor={[cliente.cidade, cliente.uf].filter(Boolean).join(' / ')}
          />
          <Dado rotulo="Referência" valor={cliente.referencia} className="col-span-2" />
        </div>
      </Secao>

      <Secao titulo="Aparelho">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <Dado rotulo="Código do aparelho" valor={String(aparelho.ordem)} />
          <Dado rotulo="Aparelho" valor={aparelho.nome} />
          <Dado rotulo="Marca" valor={aparelho.marca} />
          <Dado rotulo="Modelo" valor={aparelho.modelo} />
          <Dado rotulo="PNC" valor={aparelho.pnc} />
          <Dado
            rotulo="Garantia até"
            valor={aparelho.garantiaAte && formatarData(aparelho.garantiaAte)}
          />
          <Dado rotulo="Observação" valor={aparelho.observacao} className="col-span-2" />
        </div>
      </Secao>

      <Secao titulo="Serviço">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <Dado rotulo="Abertura" valor={formatarData(os.abertura)} />
          <Dado rotulo="Status" valor={ROTULO_STATUS[os.status]} />
          <Dado rotulo="Valor" valor={formatarMoeda(os.valor)} />
          <Dado rotulo="Taxa de deslocamento" valor={formatarMoeda(os.taxaDeslocamento)} />
          <Dado rotulo="Fechamento" valor={os.fechamento && formatarData(os.fechamento)} />
          <Dado rotulo="Garantia" valor={os.garantiaDias ? `${os.garantiaDias} dias` : null} />
          <Dado rotulo="Problema relatado" valor={os.relatado} className="col-span-2" />
          <Dado rotulo="Problema identificado" valor={os.identificado} className="col-span-2" />
          <Dado rotulo="Problema solucionado" valor={os.solucionado} className="col-span-2" />
          <Dado rotulo="Observação" valor={os.observacao} className="col-span-2" />
        </div>
      </Secao>

      {pagamentos.length > 0 && (
        <Secao titulo="Pagamentos">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-600">
                <th className="py-1 font-normal">Forma</th>
                <th className="font-normal">Parcelas</th>
                <th className="font-normal">Data</th>
                <th className="text-right font-normal">Valor</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id} className="border-neutral-200 border-t">
                  <td className="py-1">{ROTULO_TIPO_PAGAMENTO[pagamento.tipo]}</td>
                  <td>{pagamento.parcelas === 0 ? 'À vista' : `${pagamento.parcelas}x`}</td>
                  <td>{formatarData(pagamento.data)}</td>
                  <td className="text-right">{formatarMoeda(pagamento.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      {anteriores.length > 0 && (
        <Secao titulo="Últimos serviços neste aparelho">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-600">
                <th className="py-1 font-normal">OS</th>
                <th className="font-normal">Abertura</th>
                <th className="font-normal">Fechamento</th>
                <th className="font-normal">Solução</th>
                <th className="font-normal">Garantia</th>
                <th className="text-right font-normal">Valor</th>
                <th className="text-right font-normal">Desloc.</th>
              </tr>
            </thead>
            <tbody>
              {anteriores.map((ordem) => (
                <tr key={ordem.id} className="border-neutral-200 border-t">
                  <td className="py-1">{ordem.id}</td>
                  <td>{formatarData(ordem.abertura)}</td>
                  <td>{formatarData(ordem.fechamento)}</td>
                  <td>{ordem.solucionado || '—'}</td>
                  <td>{ordem.garantiaDias ? `${ordem.garantiaDias} dias` : '—'}</td>
                  <td className="text-right">{formatarMoeda(ordem.valor)}</td>
                  <td className="text-right">{formatarMoeda(ordem.taxaDeslocamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      <footer className="mt-10 grid grid-cols-2 gap-10 break-inside-avoid text-center text-xs">
        <div className="border-neutral-800 border-t pt-1">Assinatura do cliente</div>
        <div className="border-neutral-800 border-t pt-1">Assinatura do técnico</div>
      </footer>
    </article>
  )
}
