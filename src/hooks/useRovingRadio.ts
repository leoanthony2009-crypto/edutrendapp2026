import { useRef, type KeyboardEvent } from 'react'

/**
 * WAI-ARIA radio-group keyboard pattern (audit P1-2): roving tabindex with
 * Arrow/Home/End moving focus AND selection. Spread `itemProps(i)` onto each
 * `role="radio"` button inside a `role="radiogroup"` container.
 */
export function useRovingRadio(count: number, selectedIndex: number, onSelect: (index: number) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const move = (from: number, delta: number) => {
    if (count === 0) return
    const next = (from + delta + count) % count
    onSelect(next)
    refs.current[next]?.focus()
  }

  const onKeyDown = (index: number) => (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        move(index, 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        move(index, -1)
        break
      case 'Home':
        e.preventDefault()
        move(index, -index)
        break
      case 'End':
        e.preventDefault()
        move(index, count - 1 - index)
        break
    }
  }

  const itemProps = (index: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[index] = el
    },
    role: 'radio' as const,
    'aria-checked': selectedIndex === index,
    tabIndex: (selectedIndex >= 0 ? selectedIndex : 0) === index ? 0 : -1,
    onKeyDown: onKeyDown(index),
    onClick: () => onSelect(index),
  })

  return { itemProps }
}
