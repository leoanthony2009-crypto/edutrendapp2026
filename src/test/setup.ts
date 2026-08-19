import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Server test files run in the node environment — DOM setup does not apply.
const hasDom = typeof window !== 'undefined'

afterEach(() => {
  if (!hasDom) return
  cleanup()
  window.localStorage.clear()
})

// jsdom lacks matchMedia; the splash and reduced-motion checks use it.
if (hasDom && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// Recharts ResponsiveContainer needs an element size in jsdom.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (hasDom && !window.ResizeObserver) {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
}
