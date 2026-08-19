import { useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function useDialogBehavior(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const node = ref.current
    const first = node?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const focusables = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restoreRef.current?.focus()
    }
  }, [open, onClose])

  return ref
}

/** Bottom sheet (mobile) / centered dialog (desktop) with focus trap + Esc. */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}) {
  const ref = useDialogBehavior(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center">
      <button aria-label="Close" className="absolute inset-0 cursor-default bg-bloom-charcoal/40" onClick={onClose} tabIndex={-1} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="animate-fade-up relative w-full rounded-t-[26px] bg-bloom-cream p-5 pb-7 shadow-xl md:max-w-md md:rounded-card"
      >
        {children}
      </div>
    </div>
  )
}

/** Centered modal (Micro-Learning Shot, National Report). */
export function Modal({
  open,
  onClose,
  label,
  children,
  className = '',
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}) {
  const ref = useDialogBehavior(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5">
      <button aria-label="Close" className="absolute inset-0 cursor-default bg-bloom-charcoal/45" onClick={onClose} tabIndex={-1} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`animate-fade-up relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[22px] bg-bloom-cream shadow-xl ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
