import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Screen } from '../components/AppShell'
import { Card, PageHeader } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { useAsync } from '../hooks/useAsync'
import { SCHOOL_CONFIG } from '../services/time'
import {
  DOMAIN_SNAPSHOT,
  RECURRING_THEMES,
  getParticipation,
  getTrendSeries,
  voicesToday,
  type TrendRange,
} from '../services/trends'

const RANGE_TABS: Array<{ key: TrendRange; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'term', label: 'Term' },
]

const TONE_COLORS = { concern: 'var(--color-concern)', warn: 'var(--color-gold)', good: 'var(--color-good)' }

export function Trends() {
  const [range, setRange] = useState<TrendRange>('7d')
  const { data, loading, error, reload } = useAsync(
    () => ({
      series: getTrendSeries(range),
      participation: getParticipation(),
      voices: voicesToday(),
    }),
    [range],
  )

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const { series, participation } = data
  const chartData = series.points.map((p, i) => ({ ...p, isToday: i === series.points.length - 1 }))
  const chartSummary = `Pastoral Pulse over time, ${series.caption}: ${series.points
    .map((p) => `${p.label} ${p.value}`)
    .join(', ')}. Today's point includes pulses collated today.`

  return (
    <Screen wide>
      <PageHeader title="Trends" subtitle={`Collated from ${data.voices} pulse runs · ${SCHOOL_CONFIG.schoolName}`} />

      <div className="mx-4 mt-3.5 flex rounded-xl bg-sand p-[3px] md:mx-0 md:max-w-sm" role="tablist" aria-label="Time range">
        {RANGE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={range === t.key}
            onClick={() => setRange(t.key)}
            className={`min-h-10 flex-1 rounded-[10px] py-2 text-[12.5px] font-bold transition-colors ${
              range === t.key ? 'bg-white text-ink' : 'text-meta hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 px-4 pt-3 md:grid-cols-2 md:px-0 lg:grid-cols-2">
        <Card className="md:col-span-2">
          <h2 className="text-sm font-semibold">Pastoral Pulse over time</h2>
          <p className="mt-0.5 text-[11px] text-meta">{series.caption} · includes today's collated pulses</p>
          <div className="mt-2.5 h-40 w-full md:h-56" role="img" aria-label={chartSummary}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -26 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6F6A58' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EDE6D3' }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#6F6A58' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: '#C8A951', strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: '#FAF6EC',
                    border: '1px solid #E0D9C6',
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: 'Instrument Sans, sans-serif',
                  }}
                  formatter={(value) => [`${value} / 100`, 'Pulse']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#295C4D"
                  strokeWidth={2.5}
                  fill="#C8A951"
                  fillOpacity={0.15}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props as { cx: number; cy: number; payload: { isToday: boolean }; index: number }
                    return payload.isToday ? (
                      <circle key={index} cx={cx} cy={cy} r={4.5} fill="#C8A951" />
                    ) : (
                      <circle key={index} cx={cx} cy={cy} r={2.2} fill="#295C4D" />
                    )
                  }}
                  activeDot={{ r: 5, fill: '#C8A951' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Text alternative for the chart (DESIGN_REVIEW P2-8) */}
          <table className="sr-only">
            <caption>Pastoral Pulse scores, {series.caption}</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Score out of 100</th>
              </tr>
            </thead>
            <tbody>
              {series.points.map((p, i) => (
                <tr key={p.label + i}>
                  <td>{p.label}</td>
                  <td>{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">Domain snapshot · this week</h2>
          <p className="mt-0.5 text-[11px] text-meta">The eight Bloom pastoral domains</p>
          <div className="mt-3 flex flex-col gap-2">
            {DOMAIN_SNAPSHOT.map((d) => {
              const color = d.value < 60 ? 'var(--color-concern)' : d.value < 68 ? 'var(--color-gold)' : 'var(--color-good)'
              const deltaColor = d.delta > 0 ? 'text-good-text' : d.delta < 0 ? 'text-concern-text' : 'text-meta'
              const deltaText =
                d.delta > 0 ? `up ${d.delta}` : d.delta < 0 ? `down ${Math.abs(d.delta)}` : 'no change'
              return (
                <div key={d.label} className="grid grid-cols-[118px_1fr_44px] items-center gap-2">
                  <span className="text-[11px] font-semibold text-ink-soft">{d.label}</span>
                  <div
                    className="h-[9px] overflow-hidden rounded-chip bg-cream-dim"
                    role="img"
                    aria-label={`${d.label}: ${d.value} out of 100, ${deltaText} this week`}
                  >
                    <div className="h-full rounded-chip" style={{ width: `${d.value}%`, background: color }} />
                  </div>
                  <span aria-hidden="true" className={`text-[11px] font-bold ${deltaColor}`}>
                    {d.delta > 0 ? '▲' : d.delta < 0 ? '▼' : '·'}
                    {Math.abs(d.delta)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <h2 className="text-sm font-semibold">Voice participation</h2>
            <p className="mt-0.5 text-[11px] text-meta">Share of pupils completing the daily carousel</p>
            <div
              className="mt-3 flex h-16 items-end gap-1.5"
              role="img"
              aria-label={`Participation by day: ${participation.map((p) => `${p.label} ${p.value} percent`).join(', ')}`}
            >
              {participation.map((p, i) => (
                <div key={p.label + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className={`w-full rounded-[5px] ${p.isToday ? 'bg-gold' : 'bg-green'}`}
                    style={{ height: `${Math.round(p.value * 0.72)}%` }}
                  />
                  <span aria-hidden="true" className="text-[9px] text-meta">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Recurring themes</h2>
            <ul className="mt-3 flex list-none flex-col gap-2.5">
              {RECURRING_THEMES.map((t) => (
                <li key={t.label} className="grid grid-cols-[1fr_90px] items-center gap-2.5">
                  <div>
                    <div className="text-[13px] font-semibold">{t.label}</div>
                    <div className="text-[10.5px] text-meta">{t.sub}</div>
                  </div>
                  <div
                    className="h-[9px] overflow-hidden rounded-chip bg-cream-dim"
                    role="img"
                    aria-label={`${t.label}: theme weight ${t.weight} percent`}
                  >
                    <div className="h-full rounded-chip" style={{ width: `${t.weight}%`, background: TONE_COLORS[t.tone] }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Screen>
  )
}
