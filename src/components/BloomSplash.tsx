import { useEffect, useState } from 'react'
import { BloomMarkAnimated } from './BloomLogo'

/**
 * Launch splash — first launch only (DESIGN_REVIEW P1.6), ≤1s of blocking.
 * Reduced motion collapses the animation via the global media query.
 */
export function BloomSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduced ? 150 : 950
    const t1 = window.setTimeout(() => setLeaving(true), hold)
    const t2 = window.setTimeout(onDone, hold + (reduced ? 0 : 300))
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      role="status"
      aria-label="Bloom is starting"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bloom-cream transition-opacity duration-300 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <BloomMarkAnimated size={120} />
      <div className="animate-fade-up mt-5 font-display text-[32px] font-extrabold text-bloom-green" style={{ animationDelay: '0.7s' }}>
        Bloom
      </div>
      <div
        className="animate-fade-up mt-1 text-xs font-semibold tracking-[0.16em] text-ink-gold uppercase"
        style={{ animationDelay: '0.85s' }}
      >
        Your voice matters
      </div>
    </div>
  )
}
