import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { vi } from 'vitest'

// O jsdom não implementa matchMedia (usado para descobrir o tema do sistema); aqui é sempre claro.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

// Nem ResizeObserver (usado pelos componentes do Radix, como checkbox e diálogos).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Nem rolagem de janela (o roteador rola para o topo ao trocar de tela).
window.scrollTo = () => undefined

// O Select do Radix usa captura de ponteiro e rolagem até a opção, que o jsdom também não tem.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => undefined
Element.prototype.scrollIntoView ??= () => undefined

// O echarts desenha em canvas, que o jsdom não tem: em todos os testes o gráfico vira um <div> com a
// opção recebida (para conferir o que é entregue a ele).
vi.mock('echarts-for-react/lib/core', () => ({
  default: ({ option }: { option: unknown }) =>
    createElement('div', { 'data-testid': 'grafico', 'data-option': JSON.stringify(option) }),
}))
