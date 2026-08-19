import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '../types/survey'
import { useAppStore } from '../store/AppStore'
import { ProgressBar } from './ui'

export const UNLOCK_TARGET = 10

/** Survey Builder promo card on teacher/leader Today — shows unlock progress. */
export function SurveyBuilderPromoCard({ role }: { role: Role }) {
  const { pulsesCompleted } = useAppStore()
  const done = pulsesCompleted[role] ?? 0
  const unlocked = done >= UNLOCK_TARGET
  const remaining = Math.max(0, UNLOCK_TARGET - done)
  return (
    <Link
      to="/builder"
      className="relative block overflow-hidden rounded-card bg-linear-135 from-bloom-green-deep to-bloom-green p-4 text-on-dark transition-transform duration-150 hover:scale-[1.01]"
    >
      <span aria-hidden="true" className="absolute -right-4 -bottom-4 h-[90px] w-[90px] rounded-full bg-bloom-gold-bright/12" />
      <span className="micro-label inline-block rounded-md bg-bloom-gold-bright px-2 py-1 text-ink">Survey Builder</span>
      <div className="mt-2 font-display text-lg font-extrabold">Launch your own survey</div>
      <p className="mt-1 text-xs leading-relaxed text-on-dark-soft">
        {unlocked
          ? 'Turn your idea into a live pulse for your class or school. Results collate in Trends within 24 hours.'
          : 'Build and launch your own pulses. Unlocks after 10 completed pulses — keep answering.'}
      </p>
      <ProgressBar
        value={Math.min(done, UNLOCK_TARGET)}
        max={UNLOCK_TARGET}
        label={`Survey Builder unlock progress: ${Math.min(done, UNLOCK_TARGET)} of ${UNLOCK_TARGET} pulses completed`}
        className="mt-2.5 h-1.5"
        trackClass="bg-on-dark/15"
        barClass="bg-bloom-gold-bright"
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-on-dark-soft">
        <span>{unlocked ? 'Unlocked ✓' : `${Math.min(done, UNLOCK_TARGET)} of ${UNLOCK_TARGET} pulses completed`}</span>
        <span className="font-extrabold text-bloom-gold-bright">{unlocked ? 'Open →' : `${remaining} to go`}</span>
      </div>
    </Link>
  )
}

/** "Worth noticing" connected-signal card — purple accent, never diagnoses. */
export function WorthNoticingCard({ body, chips }: { body: ReactNode; chips: Array<{ label: string; muted?: boolean }> }) {
  return (
    <section aria-label="Worth noticing" className="rounded-card border border-[#DCD3E8] bg-white p-4">
      <div className="micro-label text-mark-selfemptying">Worth noticing</div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">{body}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip.muted ? 'bg-bloom-cream-dim text-ink-meta' : 'bg-[#F1ECF7] text-[#6E548D]'}`}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </section>
  )
}
