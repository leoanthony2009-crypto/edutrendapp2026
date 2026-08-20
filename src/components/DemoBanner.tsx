/**
 * Shown only in ephemeral demo deployments (VITE_BLOOM_DEMO=1), e.g. the
 * serverless preview. Bloom's rules are genuinely enforced there, but the
 * storage is not durable — saying so plainly matters more for a
 * safeguarding tool than a tidy header.
 */
export function DemoBanner() {
  if (import.meta.env.VITE_BLOOM_DEMO !== '1') return null
  return (
    <div role="note" className="bg-bloom-charcoal px-4 py-2 text-center text-[11.5px] leading-relaxed text-on-dark">
      <b className="font-extrabold text-bloom-gold-bright">Demo build</b> · sample school data, storage resets
      periodically. Never enter real pupil information.
    </div>
  )
}
