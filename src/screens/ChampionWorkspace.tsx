import { useCallback, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Repeat2, ShieldQuestion } from 'lucide-react'
import type { ChampionAlert, ChampionOutcome, WatchlistAction } from '../types/survey'
import {
  acknowledgeAlert,
  closeAlert,
  listOneChildEntries,
  setWatchlistAction,
  slaHoursRemaining,
  triagedAlerts,
  watchlist,
  watchlistActions,
} from '../services/champion'
import { useAppStore } from '../store/AppStore'
import { Card, MarkBadge, PageHeader, PrivacyNote, ScreenSkeleton, StatusBadge } from '../components/ui'
import { useLoaded } from '../hooks/useLoaded'

const CHAMPION_ID = 'champion-demo'

const TRIGGER_META = {
  free_text: { label: 'Pulse free text', icon: MessageCircle },
  safeguarding: { label: 'Tell a leader', icon: ShieldQuestion },
  pattern: { label: 'Pattern · One Child', icon: Repeat2 },
} as const

const OUTCOMES: Array<{ value: ChampionOutcome; label: string }> = [
  { value: 'spoke_with_pupil', label: 'Spoke with pupil' },
  { value: 'parent_contact', label: 'Parent contact' },
  { value: 'safeguarding_referral', label: 'Safeguarding referral' },
  { value: 'no_further_action', label: 'No further action' },
]

const WATCHLIST_ACTIONS: WatchlistAction[] = ['Reviewed', 'Parent contact', 'Safeguarding']

/** Calm SLA phrasing — informative, never alarm-styled (council Seat 4). */
function slaLabel(alert: ChampionAlert): string {
  if (alert.status !== 'open') return alert.status === 'reviewed' ? 'Acknowledged' : 'Closed'
  const h = slaHoursRemaining(alert)
  if (h >= 1) return `Read within ${Math.ceil(h)}h`
  if (h >= 0) return 'Read within the hour'
  return `${Math.ceil(-h)}h past the 24h read window`
}

function AlertRow({ alert, onChange }: { alert: ChampionAlert; onChange: () => void }) {
  const [closing, setClosing] = useState(false)
  const [outcome, setOutcome] = useState<ChampionOutcome>('spoke_with_pupil')
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(false)
  const meta = TRIGGER_META[alert.triggerType]
  const Icon = meta.icon
  const open = alert.status === 'open'
  const overdue = open && slaHoursRemaining(alert) < 0

  return (
    <li className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bloom-cream-dim px-2.5 py-1 text-[10.5px] font-bold text-ink-soft">
          <Icon aria-hidden="true" className="h-3 w-3" /> {meta.label}
        </span>
        {alert.pupilHandle ? <span className="text-[11px] font-extrabold">{alert.pupilHandle}</span> : null}
        {alert.marks.map((m) => (
          <MarkBadge key={m} mark={m} />
        ))}
        <span className={`ml-auto text-[10.5px] font-bold ${overdue ? 'text-ink-burgundy' : open ? 'text-ink-gold' : 'text-ink-meta'}`}>
          {slaLabel(alert)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#4A4636]">{alert.context}</p>

      {alert.status === 'actioned' && alert.outcome ? (
        <p className="mt-2 rounded-[9px] bg-bloom-cream-dim px-3 py-2 text-[11.5px] text-ink-soft">
          <b>{OUTCOMES.find((o) => o.value === alert.outcome)?.label}.</b> {alert.outcomeNote}
          <span className="mt-1 block text-[10px] text-ink-meta">Outcome notes stay in this workspace — never exported.</span>
        </p>
      ) : null}

      {open && !closing ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            onClick={() => {
              acknowledgeAlert(alert.id, CHAMPION_ID)
              onChange()
            }}
            className="min-h-10 rounded-[10px] bg-bloom-green px-3.5 py-2 text-[11.5px] font-bold text-on-dark transition-colors hover:bg-bloom-green-deep"
          >
            Mark as read
          </button>
          <button
            onClick={() => setClosing(true)}
            className="min-h-10 rounded-[10px] border border-bloom-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
          >
            Log an outcome…
          </button>
        </div>
      ) : null}
      {alert.status === 'reviewed' && !closing ? (
        <div className="mt-2.5">
          <button
            onClick={() => setClosing(true)}
            className="min-h-10 rounded-[10px] border border-bloom-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
          >
            Log an outcome…
          </button>
        </div>
      ) : null}

      {closing ? (
        <form
          className="mt-2.5 rounded-[12px] border border-bloom-gold-line bg-bloom-gold-tint p-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) {
              setNoteError(true)
              return
            }
            closeAlert(alert.id, CHAMPION_ID, outcome, note)
            setClosing(false)
            onChange()
          }}
        >
          <label className="micro-label block text-ink-gold" htmlFor={`outcome-${alert.id}`}>
            Outcome
          </label>
          <select
            id={`outcome-${alert.id}`}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as ChampionOutcome)}
            className="mt-1.5 w-full rounded-[9px] border border-bloom-line-strong bg-white px-2.5 py-2.5 text-[13px] outline-none focus:border-bloom-green"
          >
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="micro-label mt-2.5 block text-ink-gold" htmlFor={`note-${alert.id}`}>
            Outcome note (required)
          </label>
          <textarea
            id={`note-${alert.id}`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setNoteError(false)
            }}
            rows={2}
            aria-invalid={noteError}
            aria-describedby={noteError ? `note-error-${alert.id}` : undefined}
            placeholder="What happened, and what was agreed"
            className="mt-1.5 w-full resize-y rounded-[9px] border border-bloom-line-strong bg-white px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
          />
          {noteError ? (
            <p id={`note-error-${alert.id}`} role="alert" className="mt-1 text-[11px] font-semibold text-ink-burgundy">
              An outcome note is required before closing.
            </p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              className="min-h-10 rounded-[10px] bg-bloom-charcoal px-3.5 py-2 text-[11.5px] font-bold text-on-dark transition-colors hover:bg-black"
            >
              Close alert
            </button>
            <button
              type="button"
              onClick={() => setClosing(false)}
              className="min-h-10 px-2 text-[11.5px] font-bold text-ink-meta underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </li>
  )
}

/**
 * FIX 1 — Champion workspace (spec § 3.4/4.2; council protocol Seat 4).
 * Only the school's Pastoral Champion (leader) can open it. Alerts triage by
 * SLA remaining, closing requires a structured outcome note, and nothing here
 * frames a falling alert count as "improvement".
 */
export function ChampionWorkspace() {
  const store = useAppStore()
  const loaded = useLoaded()
  const [, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const role = store.account!.role
  if (role !== 'leader') return <Navigate to="/today" replace />
  if (!loaded) return <ScreenSkeleton />

  const alerts = triagedAlerts()
  const open = alerts.filter((a) => a.status === 'open')
  const closed = alerts.filter((a) => a.status !== 'open')
  const rows = watchlist(listOneChildEntries())
  const actions = watchlistActions()

  return (
    <div className="mx-auto max-w-2xl space-y-3 pb-4">
      <PageHeader
        title="Champion workspace"
        sub="A referral point, not an emergency service · read within 24 hours"
        back={
          <Link to="/today" aria-label="Back to Today" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />

      <div className="space-y-3 px-4 md:px-0">
        <PrivacyNote>
          <b>Only you see this.</b> Alert text and your outcome notes stay in this workspace — they never appear in
          exports, digests or Trends. Pupils are handles, never names.
        </PrivacyNote>

        <section aria-label="Alerts">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-bold">Alerts</h2>
            <span className="text-[11px] text-ink-meta">
              {open.length} awaiting your read · {closed.length} handled
            </span>
          </div>
          {alerts.length === 0 ? (
            <Card className="mt-2 text-center text-[12.5px] text-ink-meta">
              Nothing waiting. Alerts from pulses, Tell-a-leader notes and One Child patterns arrive here.
            </Card>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {alerts.map((a) => (
                <AlertRow key={a.id} alert={a} onChange={refresh} />
              ))}
            </ul>
          )}
        </section>

        <section aria-label="One Child watchlist">
          <h2 className="font-display text-[17px] font-bold">One Child · Watchlist</h2>
          <p className="mt-0.5 text-[11.5px] text-ink-meta">
            Pupils noted in two or more pulses across three or more days in the past fortnight.
          </p>
          {rows.length === 0 ? (
            <Card className="mt-2 text-center text-[12.5px] text-ink-meta">No pupils currently meet the watchlist threshold.</Card>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {rows.map((r) => (
                <li key={r.pupilHandle} className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-extrabold">{r.pupilHandle}</span>
                    <span className="text-[11px] text-ink-meta">
                      {r.mentions} mentions · {r.days} days · {r.staff} staff
                    </span>
                    {r.marks.map((m) => (
                      <MarkBadge key={m} mark={m} />
                    ))}
                    {actions[r.pupilHandle] ? <StatusBadge tone="gold">{actions[r.pupilHandle]}</StatusBadge> : null}
                  </div>
                  {r.pattern ? <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{r.pattern}</p> : null}
                  <fieldset className="mt-2.5">
                    <legend className="micro-label text-ink-meta">Champion action</legend>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Champion action for ${r.pupilHandle}`}>
                      {WATCHLIST_ACTIONS.map((action) => {
                        const selected = actions[r.pupilHandle] === action
                        return (
                          <button
                            key={action}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setWatchlistAction(r.pupilHandle, action)
                              refresh()
                            }}
                            className={`min-h-10 rounded-full border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold transition-colors duration-150 ${
                              selected
                                ? 'border-bloom-green bg-bloom-green text-on-dark'
                                : 'border-bloom-line-strong bg-white text-ink-soft hover:border-bloom-green'
                            }`}
                          >
                            {action}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pb-4 text-[11px] leading-relaxed text-ink-meta">
          A quiet week and a busy week are both just weeks — fewer alerts is not a score, and more is not a failure.
          What matters is that every voice was read within 24 hours.
        </p>
      </div>
    </div>
  )
}
