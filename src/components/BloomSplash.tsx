import { useCallback, useEffect, useRef, useState } from 'react'
import { BloomMarkAnimated } from './BloomLogo'

/**
 * Launch splash — first launch only (DESIGN_REVIEW P1.6), ≤1s of blocking,
 * skippable with tap/click/Enter (audit P1-5). Reduced motion collapses the
 * animation via the global media query and shortens the hold.
 */
export function BloomSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(false)

  const finish = useCallback(
    (immediate: boolean) => {
      if (doneRef.current) return
      doneRef.current = true
      setLeaving(true)
      window.setTimeout(onDone, immediate ? 0 : 300)
    },
    [onDone]
  )

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduced ? 150 : 950
    const t = window.setTimeout(() => finish(reduced), hold)
    return () => window.clearTimeout(t)
  }, [finish])

  return (
    <button
      type="button"
      aria-label="Bloom is starting — tap to skip"
      onClick={() => finish(true)}
      className={`fixed inset-0 z-50 flex w-full cursor-default flex-col items-center justify-center border-0 bg-bloom-cream transition-opacity duration-300 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <BloomMarkAnimated size={120} />
      <span className="animate-fade-up mt-5 font-display text-[32px] font-extrabold text-bloom-green" style={{ animationDelay: '0.7s' }}>
        Bloom
      </span>
      <span
        className="animate-fade-up mt-1 text-xs font-semibold tracking-[0.16em] text-ink-gold uppercase"
        style={{ animationDelay: '0.85s' }}
      >
        Your voice matters
      </span>
    </button>
  )
}
