import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/AppStore'
import { SCHOOL_NAME } from '../components/AppShell'
import { Card, PageHeader, ScreenSkeleton } from '../components/ui'
import { useLoaded } from '../hooks/useLoaded'
import {
  collatedToday,
  DOMAIN_SNAPSHOT,
  PARTICIPATION_DAYS,
  PARTICIPATION_WEEK,
  PULSE_30D,
  PULSE_7D,
  PULSE_TERM,
  RECURRING_THEMES,
} from '../data/demoAggregates'

type Range = '7d' | '30d' | 'term'

const RANGES: Record<Range, { label: string; caption: string; start: string; base: number[] }> = {
  '7d': { label: '7 days', caption: 'Last 7 school days', start: 'Wed', base: PULSE_7D },
  '30d': { label: '30 days', caption: 'Last 30 days', start: '4 wks ago', base: PULSE_30D },
  term: { label: 'Term', caption: 'Term 1 to date', start: 'wk 1', base: PULSE_TERM },
}

export function Trends() {
  const store = useAppStore()
  const loaded = useLoaded()
  const [range, setRange] = useState<Range>('7d')

  const role = store.account!.role
  const run = store.todayRun(role)
  const today = collatedToday(run?.score)

  const data = useMemo(
    () => [...RANGES[range].base, today].map((value, i, arr) => ({ label: i === arr.length - 1 ? 'today' : `${i + 1}`, value })),
    [range, today]
  )

  if (!loaded) return <ScreenSkeleton />

  const submittedCount = 165 + (run ? 1 : 0)
  const participation = [...PARTICIPATION_WEEK, run ? 86 : 81]

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Trends" sub={`Collated from ${submittedCount} pulse runs · ${SCHOOL_NAME}`} />

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
          <p className="mt-0.5 text-[11px] text-ink-meta">{RANGES[range].caption} · includes today's collated pulses</p>
          <div className="mt-2.5 h-40 md:h-56" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 8, bottom: 0, left: -26 }}>
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
                  dot={(props: { index?: number; cx?: number; cy?: number }) => {
                    const isToday = props.index === data.length - 1
                    return (
                      <circle
                        key={props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isToday ? 4.5 : 2.5}
                        fill={isToday ? '#C8A951' : '#295C4D'}
                      />
                    )
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between px-1 pt-0.5 text-[10px] text-ink-meta" aria-hidden="true">
            <span>{RANGES[range].start}</span>
            <span>today</span>
          </div>
          {/* Text alternative for the chart (DESIGN_REVIEW P2.8) */}
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-bold text-bloom-green">View as data table</summary>
            <table className="mt-2 w-full text-left text-[11px]">
              <caption className="sr-only">Pastoral Pulse score by period, out of 100</caption>
              <thead>
                <tr className="text-ink-meta">
                  <th scope="col" className="py-1 pr-2 font-semibold">
                    Period
                  </th>
                  <th scope="col" className="py-1 font-semibold">
                    Pulse / 100
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} className="border-t border-bloom-cream-dim">
                    <td className="py-1 pr-2">{d.label === 'today' ? 'Today' : `Point ${d.label}`}</td>
                    <td className="py-1 font-bold">{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">Domain snapshot · this week</h2>
          <p className="mt-0.5 text-[11px] text-ink-meta">The eight Bloom pastoral domains</p>
          <div className="mt-3 flex flex-col gap-2">
            {DOMAIN_SNAPSHOT.map((d) => {
              const color = d.value < 60 ? '#D9634E' : d.value < 68 ? '#C8A951' : '#5BAA70'
              const deltaLabel = d.delta > 0 ? `up ${d.delta}` : d.delta < 0 ? `down ${Math.abs(d.delta)}` : 'unchanged'
              return (
                <div key={d.label} className="grid grid-cols-[118px_1fr_40px] items-center gap-2">
                  <span className="text-[11px] font-semibold text-ink-soft">{d.label}</span>
                  <div
                    className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim"
                    role="img"
                    aria-label={`${d.label}: ${d.value} out of 100, ${deltaLabel} versus last week`}
                  >
                    <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: color }} />
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-[11px] font-bold"
                    style={{ color: d.delta > 0 ? '#417E52' : d.delta < 0 ? '#A03E2D' : '#6F6A58' }}
                  >
                    {d.delta > 0 ? '▲' : d.delta < 0 ? '▼' : '·'}
                    {Math.abs(d.delta)}
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
            <div
              className="mt-3 flex h-16 items-end gap-1.5"
              role="img"
              aria-label={`Participation by day: ${participation.map((v, i) => `${PARTICIPATION_DAYS[i]} ${v}%`).join(', ')}`}
            >
              {participation.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className={`w-full rounded-[5px] ${i === participation.length - 1 ? 'bg-bloom-gold' : 'bg-bloom-green'}`}
                    style={{ height: `${Math.round(v * 0.52)}px` }}
                  />
                  <span className="text-[9px] text-ink-meta" aria-hidden="true">
                    {PARTICIPATION_DAYS[i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Recurring themes</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {RECURRING_THEMES.map((t) => (
                <div key={t.label} className="grid grid-cols-[1fr_90px] items-center gap-2.5">
                  <div>
                    <div className="text-[13px] font-semibold">{t.label}</div>
                    <div className="text-[10.5px] text-ink-meta">{t.sub}</div>
                  </div>
                  <div className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${t.label}: heat ${t.width} percent`}>
                    <div className="h-full rounded-full" style={{ width: `${t.width}%`, backgroundColor: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
