import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useMe } from '../store/AppStore'
import { Card, ErrorState, PageHeader, ScreenSkeleton } from '../components/ui'

type Range = '7d' | '30d' | 'term'
const RANGES: Record<Range, { label: string; caption: string }> = {
  '7d': { label: '7 days', caption: 'Last 7 school days' },
  '30d': { label: '30 days', caption: 'Last 30 days' },
  term: { label: 'Term', caption: 'Term to date' },
}

/** Trends — every series computed server-side from real runs, K-suppressed. */
export function Trends() {
  const me = useMe()
  const [range, setRange] = useState<Range>('7d')
  const { data: summary, error, loading, reload } = useApi(() => Api.analytics(range), [range])

  if (loading) return <ScreenSkeleton />
  if (error || !summary) return <ErrorState body="Trends could not be loaded." onRetry={reload} />

  const chartData = summary.trend.map((p) => ({ label: p.date.slice(5), value: p.value, voices: p.voices }))
  const shownPoints = summary.trend.filter((p) => p.value !== null)

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Trends" sub={`Real pulses · ${me.school.name} · suppressed below ${summary.kAnon} voices`} />

      <div role="tablist" aria-label="Time range" className="mx-4 flex rounded-xl bg-bloom-sand p-[3px] md:mx-0 md:max-w-sm">
        {(Object.keys(RANGES) as Range[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={range === key}
            onClick={() => setRange(key)}
            className={`min-h-10 flex-1 rounded-[10px] py-2 text-[12.5px] font-bold transition-colors duration-150 ${
              range === key ? 'bg-white text-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {RANGES[key].label}
          </button>
        ))}
      </div>

      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <Card className="md:col-span-2">
          <h2 className="text-sm font-semibold">Pastoral Pulse over time</h2>
          <p className="mt-0.5 text-[11px] text-ink-meta">
            {RANGES[range].caption} · gaps are days below the {summary.kAnon}-voice threshold
          </p>
          {shownPoints.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-ink-meta">No day in this range has reached {summary.kAnon} voices yet.</p>
          ) : (
            <>
              <div className="mt-2.5 h-40 md:h-56" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart accessibilityLayer={false} data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -26 }}>
                    <CartesianGrid stroke="#F3EFE2" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6F6A58' }} tickLine={false} axisLine={{ stroke: '#EDE6D3' }} interval="preserveStartEnd" />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#6F6A58' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value} / 100`, 'Pulse']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E8E2CF', background: '#FFFFFF', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#295C4D"
                      strokeWidth={2.5}
                      fill="#C8A951"
                      fillOpacity={0.15}
                      connectNulls
                      dot={(props: { index?: number; cx?: number; cy?: number }) => {
                        const isToday = chartData[props.index ?? 0]?.label === summary.today.slice(5)
                        return <circle key={props.index} cx={props.cx} cy={props.cy} r={isToday ? 4.5 : 2.5} fill={isToday ? '#C8A951' : '#295C4D'} />
                      }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-bold text-bloom-green">View as data table</summary>
                <table className="mt-2 w-full text-left text-[11px]">
                  <caption className="sr-only">Pastoral Pulse score by day, out of 100</caption>
                  <thead>
                    <tr className="text-ink-meta">
                      <th scope="col" className="py-1 pr-2 font-semibold">Day</th>
                      <th scope="col" className="py-1 pr-2 font-semibold">Pulse / 100</th>
                      <th scope="col" className="py-1 font-semibold">Voices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.trend.map((p) => (
                      <tr key={p.date} className="border-t border-bloom-cream-dim">
                        <td className="py-1 pr-2">{p.date}</td>
                        <td className="py-1 pr-2 font-bold">{p.value ?? `below ${summary.kAnon} voices`}</td>
                        <td className="py-1">{p.voices}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">Domain snapshot · this week</h2>
          <p className="mt-0.5 text-[11px] text-ink-meta">The eight Bloom pastoral domains, from real pupil answers</p>
          <div className="mt-3 flex flex-col gap-2">
            {summary.domains.map((d) => {
              if (d.suppressed) {
                return (
                  <div key={d.domain} className="grid grid-cols-[118px_1fr_40px] items-center gap-2">
                    <span className="text-[11px] font-semibold text-ink-soft">{d.domain}</span>
                    <span className="text-[10.5px] text-ink-meta">gathering · {d.voices}/{summary.kAnon} voices</span>
                    <span aria-hidden="true" className="text-[11px] text-ink-meta">—</span>
                  </div>
                )
              }
              const color = d.value! < 60 ? '#D9634E' : d.value! < 68 ? '#C8A951' : '#5BAA70'
              const deltaLabel = d.delta === null ? 'no prior window' : d.delta > 0 ? `up ${d.delta}` : d.delta < 0 ? `down ${Math.abs(d.delta)}` : 'unchanged'
              return (
                <div key={d.domain} className="grid grid-cols-[118px_1fr_40px] items-center gap-2">
                  <span className="text-[11px] font-semibold text-ink-soft">{d.domain}</span>
                  <div className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${d.domain}: ${d.value} out of 100 from ${d.voices} voices, ${deltaLabel}`}>
                    <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: color }} />
                  </div>
                  <span aria-hidden="true" className="text-[11px] font-bold" style={{ color: d.delta === null ? '#6F6A58' : d.delta > 0 ? '#417E52' : d.delta < 0 ? '#A03E2D' : '#6F6A58' }}>
                    {d.delta === null ? '·' : d.delta > 0 ? `▲${d.delta}` : d.delta < 0 ? `▼${Math.abs(d.delta)}` : '·0'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <h2 className="text-sm font-semibold">Voice participation</h2>
            <p className="mt-0.5 text-[11px] text-ink-meta">Share of pupils completing the daily carousel</p>
            {summary.participation.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-meta">No participation recorded in this range yet.</p>
            ) : (
              <div
                className="mt-3 flex h-16 items-end gap-1.5"
                role="img"
                aria-label={`Participation by day: ${summary.participation.map((p) => `${p.date} ${p.pct}%`).join(', ')}`}
              >
                {summary.participation.map((p) => (
                  <div key={p.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className={`w-full rounded-[5px] ${p.date === summary.today ? 'bg-bloom-gold' : 'bg-bloom-green'}`}
                      style={{ height: `${Math.max(3, Math.round(p.pct * 0.52))}px` }}
                    />
                    <span className="text-[9px] text-ink-meta" aria-hidden="true">
                      {p.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <p className="mt-0.5 text-[11px] text-ink-meta">Weakest domains this week — real values, never invented themes</p>
            {summary.themes.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-meta">Signals are still gathering this week.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5">
                {summary.themes.map((t) => (
                  <div key={t.label} className="grid grid-cols-[1fr_90px] items-center gap-2.5">
                    <div>
                      <div className="text-[13px] font-semibold">{t.label}</div>
                      <div className="text-[10.5px] text-ink-meta">{t.voices} voices this week</div>
                    </div>
                    <div className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${t.label}: ${t.value} out of 100`}>
                      <div className="h-full rounded-full" style={{ width: `${t.value}%`, backgroundColor: t.value < 60 ? '#D9634E' : '#C8A951' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
