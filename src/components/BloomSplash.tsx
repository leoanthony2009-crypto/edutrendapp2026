import { useEffect } from 'react'
import { BloomLogo } from './BloomLogo'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** Launch splash — first launch only, ≤1s of blocking (DESIGN_REVIEW P1-6).
    Reduced-motion users get a static mark that clears immediately. */
export function BloomSplash({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const timer = window.setTimeout(onDone, reduced ? 250 : 1000)
    return () => window.clearTimeout(timer)
  }, [onDone, reduced])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream"
      role="status"
      aria-label="Bloom is starting"
    >
      <BloomLogo size={120} animate={!reduced} />
      <div
        className="font-display mt-5 text-[32px] font-extrabold text-green"
        style={reduced ? undefined : { animation: 'fadeUp .5s ease .45s both' }}
      >
        Bloom
      </div>
      <div
        className="mt-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink"
        style={reduced ? undefined : { animation: 'fadeUp .5s ease .6s both' }}
      >
        Your voice matters
      </div>
    </div>
  )
}
