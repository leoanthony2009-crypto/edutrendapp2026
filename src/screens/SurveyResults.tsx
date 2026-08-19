import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Printer } from 'lucide-react'
import type { YearTier } from '../types/api'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useMe } from '../store/AppStore'
import { Card, ErrorState, MicroLabel, PageHeader, ScreenSkeleton, StatusBadge } from '../components/ui'
import { PermissionDenied } from '../App'

const BAR_COLORS = ['#5BAA70', '#C8A951', '#E19A45', '#D9634E', '#6F6A58']

/** Per-survey results — real persisted responses, suppression-aware (Gate 3). */
export function SurveyResults() {
  const { id } = useParams()
  const me = useMe()
  const [yearTier, setYearTier] = useState<YearTier | ''>('')
  const { data, error, loading, reload } = useApi(
    () => Api.surveyResults(id!, yearTier === '' ? undefined : yearTier),
    [id, yearTier]
  )

  if (me.role === 'student') return <PermissionDenied need="Survey results are a teacher and leader surface." />
  if (loading) return <ScreenSkeleton />
  if (error === 'forbidden') return <PermissionDenied need="Only the survey's owner and school leaders can read its results." />
  if (error || !data) return <ErrorState body="Results could not be loaded." onRetry={reload} />

  const { survey, results, seriesTrend } = data
  const gathering = results.suppressed

  return (
    <div className="mx-auto max-w-2xl space-y-3 pb-4">
      <PageHeader
        title={survey.title}
        sub={`${survey.audience}${survey.tracker ? ' · tracker' : ''} · ${results.totalResponses} response${results.totalResponses === 1 ? '' : 's'}`}
        back={
          <Link to="/builder" aria-label="Back to Survey Builder" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />

      <div className="space-y-3 px-4 md:px-0">
        <Card className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone={survey.status === 'live' ? 'live' : 'neutral'}>{survey.status}</StatusBadge>
          <span className="text-[11.5px] text-ink-meta">
            {survey.launchedAt ? `Field: ${survey.launchedAt.slice(0, 10)} → ${survey.closeDate ?? 'open'}` : 'Not yet launched'}
          </span>
          <button
            onClick={() => window.print()}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-bloom-line-strong px-3 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green print:hidden"
          >
            <Printer aria-hidden="true" className="h-3.5 w-3.5" /> Export summary
          </button>
        </Card>

        {survey.yearGroups.length > 0 || results.filtered ? (
          <div className="flex items-center gap-2 print:hidden">
            <label htmlFor="tier-filter" className="text-[11.5px] font-bold text-ink-soft">
              Filter
            </label>
            <select
              id="tier-filter"
              value={yearTier}
              onChange={(e) => setYearTier(e.target.value as YearTier | '')}
              className="min-h-11 rounded-[10px] border border-bloom-line-strong bg-white px-2.5 text-[12.5px] outline-none focus:border-bloom-green"
            >
              <option value="">Everyone</option>
              <option value="junior">Forms 1–2 / primary</option>
              <option value="senior">Forms 3–6</option>
            </select>
          </div>
        ) : null}

        {gathering ? (
          <Card className="text-center">
            <MicroLabel className="text-ink-gold">Gathering</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              {results.filtered
                ? 'This filtered view stays hidden: releasing it could identify a small group, even indirectly.'
                : `Results appear at ${data.kAnon} voices — ${results.voices} so far.`}
            </p>
          </Card>
        ) : (
          results.questions.map((q) => (
            <Card key={q.id}>
              <h2 className="text-sm font-semibold">{q.text}</h2>
              <p className="mt-0.5 text-[11px] text-ink-meta">{q.answered} answered</p>
              {q.type === 'choice' ? (
                <>
                  <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
                    {q.options!.map((o, i) => (
                      <div key={o.label} className="grid grid-cols-[96px_1fr_52px] items-center gap-2">
                        <span className="truncate text-right text-[11px] text-ink-meta">{o.label}</span>
                        <div className="h-[11px] overflow-hidden rounded-full bg-bloom-cream-dim">
                          <div className="h-full rounded-full" style={{ width: `${o.pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                        <span className="text-[11px] font-bold text-ink-soft">
                          {o.count} · {o.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="sr-only">
                    <table>
                      <caption>{q.text} — responses by option</caption>
                    <thead>
                      <tr>
                        <th scope="col">Option</th>
                        <th scope="col">Count</th>
                        <th scope="col">Share</th>
                      </tr>
                    </thead>
                      <tbody>
                        {q.options!.map((o) => (
                          <tr key={o.label}>
                            <td>{o.label}</td>
                            <td>{o.count}</td>
                            <td>{o.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : q.quotesSuppressed ? (
                <p className="mt-2 text-[12.5px] text-ink-meta">Gathering — individual answers appear at {data.kAnon} voices.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {q.quotes!.map((quote, i) => (
                    <li key={i} className="rounded-[9px] bg-bloom-cream-dim px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
                      "{quote}"
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))
        )}

        {seriesTrend ? (
          <Card>
            <h2 className="text-sm font-semibold">Tracker trend</h2>
            <p className="mt-0.5 text-[11px] text-ink-meta">Positive share (top two options) per round</p>
            <div className="mt-3 flex h-20 items-end gap-3" role="img" aria-label={`Tracker rounds: ${seriesTrend.map((r, i) => `round ${i + 1} ${r.suppressed ? 'gathering' : `${r.positive}%`}`).join(', ')}`}>
              {seriesTrend.map((r, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className={`w-full rounded-[5px] ${r.suppressed ? 'bg-bloom-sand' : 'bg-bloom-green'}`} style={{ height: `${r.suppressed ? 6 : Math.max(6, (r.positive! / 100) * 64)}px` }} />
                  <span className="text-[9px] text-ink-meta" aria-hidden="true">
                    {r.launchedAt?.slice(5, 10)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
