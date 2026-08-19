import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { Card, MicroLabel, PageHeader, ThemeBadge } from '../components/primitives'
import { EmptyState, ErrorState, PageSkeleton } from '../components/states'
import { useAsync } from '../hooks/useAsync'
import { getAlerts, getWatchlist, setWatchlistAction, updateAlertStatus } from '../services/champion'
import type { WatchlistRow } from '../types/pulse'

const ACTIONS: WatchlistRow['action'][] = ['Reviewed', 'Parent contact', 'Safeguarding']

/* Champion Watchlist (PASTORAL_PULSE_SPEC § 3.4): One Child entries aggregated
   across staff and days, plus the open alert queue with its 24-hour read window.
   Leader/Champion only — route-guarded. */

export function Watchlist() {
  const { data, loading, error, reload } = useAsync(() => ({
    rows: getWatchlist(),
    alerts: getAlerts().filter((a) => a.status === 'open'),
  }))

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  return (
    <Screen>
      <PageHeader
        title="Champion Watchlist"
        subtitle="Pupils noted in 2+ pulses across 3+ days, past two weeks · handles, never names"
        back={
          <Link to="/today" aria-label="Back to Today" className="hit-target grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-cream-dim">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />

      {data.rows.length === 0 && data.alerts.length === 0 ? (
        <EmptyState
          title="Nothing needs your eyes right now"
          body="No cross-staff patterns and no open alerts. The channel stays open and quiet."
        />
      ) : (
        <div className="grid gap-3 px-4 pt-3.5 md:grid-cols-2 md:items-start md:px-0">
          <div className="flex flex-col gap-2.5">
            <MicroLabel className="px-1 text-meta">One Child patterns</MicroLabel>
            {data.rows.length === 0 && (
              <Card>
                <p className="text-[12.5px] text-meta">No pupils met the pattern this fortnight.</p>
              </Card>
            )}
            {data.rows.map((row) => (
              <Card key={row.pupilHandle}>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[17px] font-extrabold text-ink">{row.pupilHandle}</span>
                  {row.marks.map((m) => (
                    <ThemeBadge key={m} mark={m} />
                  ))}
                  <span className="ml-auto text-[11px] font-bold text-meta">
                    {row.mentionCount} staff · {row.dayCount} days
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{row.pattern}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={`Champion action for ${row.pupilHandle}`}>
                  {ACTIONS.map((action) => {
                    const active = row.action === action
                    return (
                      <button
                        key={action}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setWatchlistAction(row.pupilHandle, action)
                          reload()
                        }}
                        className={`min-h-11 rounded-chip border-[1.5px] px-3 py-1.5 text-[11px] font-bold transition-colors ${
                          active
                            ? 'border-green bg-green text-ondark'
                            : 'border-line-strong bg-white text-ink-soft hover:border-green'
                        }`}
                      >
                        {action}
                        {active ? ' ✓' : ''}
                      </button>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <MicroLabel className="px-1 text-meta">Open alerts · 24-hour read window</MicroLabel>
            {data.alerts.length === 0 && (
              <Card>
                <p className="text-[12.5px] text-meta">No open alerts. Everything queued has been acknowledged.</p>
              </Card>
            )}
            {data.alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-center gap-2">
                  <span className="rounded-chip bg-cream-dim px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-soft">
                    {alert.triggerType.replace('_', ' ')}
                  </span>
                  {alert.marks.map((m) => (
                    <ThemeBadge key={m} mark={m} />
                  ))}
                  {alert.pupilHandle && <span className="text-[11.5px] font-bold">{alert.pupilHandle}</span>}
                  <span className="ml-auto text-[10.5px] text-meta">
                    read by {new Date(alert.readByDeadline).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{alert.context}</p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAlertStatus(alert.id, 'reviewed')
                      reload()
                    }}
                    className="min-h-11 rounded-[10px] bg-green px-3.5 py-2 text-[11.5px] font-bold text-ondark hover:bg-green-deep"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateAlertStatus(alert.id, 'actioned')
                      reload()
                    }}
                    className="min-h-11 rounded-[10px] border border-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft hover:bg-cream-dim"
                  >
                    Actioned
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Screen>
  )
}
