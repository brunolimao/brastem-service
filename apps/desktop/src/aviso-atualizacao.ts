import type { EstadoAtualizacao } from './atualizador'

const ID_DO_AVISO = 'brastem-aviso-atualizacao'

/** Texto do aviso, ou `null` quando não há nada a mostrar. */
export function textoDoAviso(estado: EstadoAtualizacao): string | null {
  switch (estado.tipo) {
    case 'verificando':
      return 'Procurando atualizações…'
    case 'baixando':
      return `Baixando a atualização ${estado.versao} (${estado.percentual}%)…`
    case 'pronta':
      return `Atualização ${estado.versao} pronta para instalar.`
    default:
      return null
  }
}

/** Progresso (0 a 1) para a barra de tarefas; `-1` apaga; `2` é "indeterminado". */
export function progressoDaBarra(estado: EstadoAtualizacao): number {
  if (estado.tipo === 'verificando') return 2
  if (estado.tipo === 'baixando') return Math.max(0, Math.min(1, estado.percentual / 100))
  return -1
}

/**
 * Código que a janela executa para mostrar (ou esconder) o aviso no canto da tela. Estilo e texto são
 * atribuídos por propriedades, sem HTML nem `<style>`, para funcionar com a política de segurança do app.
 */
export function scriptDoAviso(estado: EstadoAtualizacao): string {
  const texto = textoDoAviso(estado)
  const percentual = estado.tipo === 'baixando' ? estado.percentual : null
  return `(() => {
  const id = ${JSON.stringify(ID_DO_AVISO)}
  const texto = ${JSON.stringify(texto)}
  const percentual = ${JSON.stringify(percentual)}
  let caixa = document.getElementById(id)
  if (texto === null) { caixa?.remove(); return }
  if (!caixa) {
    caixa = document.createElement('div')
    caixa.id = id
    caixa.setAttribute('role', 'status')
    Object.assign(caixa.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647', width: '300px',
      padding: '12px 14px', borderRadius: '8px', background: '#0b1220', color: '#fff',
      font: '500 13px system-ui, sans-serif', boxShadow: '0 4px 16px rgba(0,0,0,.35)',
    })
    const rotulo = document.createElement('div')
    rotulo.dataset.parte = 'rotulo'
    const trilho = document.createElement('div')
    Object.assign(trilho.style, {
      marginTop: '8px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.2)', overflow: 'hidden',
    })
    const barra = document.createElement('div')
    barra.dataset.parte = 'barra'
    Object.assign(barra.style, { height: '100%', background: '#FF6347', transition: 'width .3s' })
    trilho.append(barra)
    caixa.append(rotulo, trilho)
    document.body.append(caixa)
  }
  caixa.querySelector('[data-parte=rotulo]').textContent = texto
  const barra = caixa.querySelector('[data-parte=barra]')
  barra.style.width = percentual === null ? '100%' : percentual + '%'
  barra.style.opacity = percentual === null ? '0.5' : '1'
})()`
}
