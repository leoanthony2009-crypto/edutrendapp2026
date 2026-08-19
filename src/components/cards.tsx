import { Link } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { ProgressBar } from './ui'

export const UNLOCK_TARGET = 10

/**
 * Survey Builder promo card on teacher/leader Today. Unlock progress derives
 * from the server-side count of real completed pulses.
 */
export function SurveyBuilderPromoCard() {
  const { today } = useAppStore()
  const done = today?.pulsesCompleted ?? 0
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
          ? 'Turn your idea into a live pulse for your class or school, with real results as voices arrive.'
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
        <span className="font-extrabold text-bloom-gold-soft">{unlocked ? 'Open →' : `${remaining} to go`}</span>
      </div>
    </Link>
  )
}
