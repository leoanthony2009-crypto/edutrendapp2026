import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/* Accessible overlay used for bottom sheets and centered modals: labelled dialog,
   focus moves in on open and returns on close, Tab cycles inside, Escape and
   backdrop click dismiss. */

const FOCUSABLE = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'

export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = 'bottom',
  showClose = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  variant?: 'bottom' | 'center'
  showClose?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled'),
      )
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restoreRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-40 flex bg-charcoal/45 ${variant === 'bottom' ? 'items-end' : 'items-center justify-center p-6'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={
          variant === 'bottom'
            ? 'w-full rounded-t-[26px] bg-cream p-5 pb-7 md:mx-auto md:max-w-md'
            : 'max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[22px] bg-cream'
        }
      >
        {showClose && variant === 'bottom' && (
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="hit-target grid h-7 w-7 flex-none place-items-center rounded-full bg-sand text-ink-soft hover:bg-line"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
