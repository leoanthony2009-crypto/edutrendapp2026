import { useEffect, useState } from 'react'

/**
 * Marks deployments whose storage is not durable.
 *
 * The signal comes from the server (`/api/meta` reports whether the backing
 * store is ephemeral) rather than a build-time flag, so the warning follows
 * the deployment's actual behaviour. A build flag can silently fail to apply
 * — and an unlabelled ephemeral deployment of a safeguarding tool is exactly
 * the failure worth engineering against. VITE_BLOOM_DEMO still forces it on.
 */
export function DemoBanner() {
  const forced = import.meta.env.VITE_BLOOM_DEMO === '1'
  const [ephemeral, setEphemeral] = useState(forced)

  useEffect(() => {
    if (forced) return
    let cancelled = false
    const base = globalThis.__BLOOM_API_BASE__ ?? ''
    fetch(`${base}/api/meta`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (!cancelled && meta?.ephemeral) setEphemeral(true)
      })
      .catch(() => {
        /* the banner is advisory; never block the app on it */
      })
    return () => {
      cancelled = true
    }
  }, [forced])

  if (!ephemeral) return null
  return (
    <div role="note" className="bg-bloom-charcoal px-4 py-2 text-center text-[11.5px] leading-relaxed text-on-dark">
      <b className="font-extrabold text-bloom-gold-bright">Demo build</b> · sample school data, storage resets
      periodically. Never enter real pupil information.
    </div>
  )
}
