import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Flower2, X } from 'lucide-react'
import { useAppStore, useMe } from '../store/AppStore'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Sheet } from '../components/Sheet'
import { Card, MicroLabel, PageHeader, ScreenSkeleton, StatusBadge, Toggle } from '../components/ui'
import { TEACHER_PERKS } from '../data/shots'

const ROLE_CHIP = { student: 'Student', teacher: 'Teacher', leader: 'Leader' }

function MyPulses() {
  const { data } = useApi(() => Api.pulseHistory(), [])
  if (!data) return null
  const days = data.history.slice(0, 30).reverse()
  return (
    <Card>
      <MicroLabel className="text-ink-meta">My pulses</MicroLabel>
      <p className="mt-1 text-[11px] text-ink-meta">
        Your last 30 days — only you see this. Streak: <b>{data.streak}</b> school day{data.streak === 1 ? '' : 's'} (one quiet
        day per term never breaks it).
      </p>
      {days.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-ink-meta">No pulses yet — today's is two minutes away.</p>
      ) : (
        <div className="mt-2.5 flex h-12 items-end gap-[3px]" role="img" aria-label={`Your pulses: ${days.map((d) => `${d.date} ${d.score ?? 'no score'}`).join(', ')}`}>
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.score ?? '—'}`}
              className={`flex-1 rounded-[3px] ${d.score === null ? 'bg-bloom-sand' : 'bg-bloom-green'}`}
              style={{ height: `${d.score === null ? 6 : Math.max(6, (d.score / 100) * 44)}px` }}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function FeedbackRow() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className="rounded-[16px] border border-bloom-line bg-white px-4 py-3.5">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-11 w-full items-center justify-between gap-3 text-left">
        <span aria-live="polite" className="text-[13.5px] font-semibold">
          {sent ? 'Feedback sent — thank you ✓' : 'Send feedback'}
        </span>
        {!sent ? <ChevronRight aria-hidden="true" className={`h-4 w-4 text-ink-meta transition-transform ${open ? 'rotate-90' : ''}`} /> : null}
      </button>
      {open && !sent ? (
        <form
          className="mt-2 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!text.trim()) return
            setFailed(false)
            try {
              await Api.sendFeedback(text)
              setSent(true)
            } catch {
              setFailed(true)
            }
          }}
        >
          <label className="sr-only" htmlFor="feedback-text">
            Your feedback
          </label>
          <textarea
            id="feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What should the Bloom team know?"
            className="w-full resize-y rounded-input border-[1.5px] border-bloom-line-strong bg-white px-3.5 py-3 text-[13px] outline-none focus:border-bloom-green"
          />
          {failed ? (
            <p role="alert" className="text-[11px] font-semibold text-ink-burgundy">
              Could not send — try again.
            </p>
          ) : null}
          <button type="submit" className="min-h-11 self-start rounded-input bg-bloom-green px-4 py-2.5 text-[12.5px] font-bold text-on-dark">
            Send
          </button>
        </form>
      ) : null}
    </div>
  )
}

export function Profile() {
  const store = useAppStore()
  const me = useMe()
  const [perksOpen, setPerksOpen] = useState(false)
  const { data: prefs, setData: setPrefs } = useApi(() => Api.prefs(), [])
  const canEdit = me.role !== 'student'

  if (!store.today) return <ScreenSkeleton />

  const rowClass =
    'flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[16px] border border-bloom-line bg-white px-4 py-3.5 text-left transition-colors hover:border-bloom-green'

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Profile" sub={`${me.school.name} · ${ROLE_CHIP[me.role]}${me.isChampion ? ' · Pastoral Champion' : ''}`} />
      <div className="flex flex-col gap-2 px-4 md:max-w-xl md:px-0">
        <div className="flex items-center gap-3 rounded-[16px] border border-bloom-line bg-white px-4 py-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-bloom-green font-display text-[19px] font-extrabold text-bloom-gold-bright">
            {me.name
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <div>
            <div className="text-sm font-bold">{me.name}</div>
            <div className="text-[11.5px] text-ink-meta">{me.displayHandle ?? ROLE_CHIP[me.role]}</div>
          </div>
        </div>

        <MyPulses />

        {canEdit ? (
          <Link to="/manage" className={rowClass}>
            <span className="text-[13.5px] font-semibold">Carousel questions</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
          </Link>
        ) : null}

        {me.isChampion ? (
          <Link to="/champion" className={rowClass}>
            <span>
              <span className="block text-[13.5px] font-semibold">Champion workspace</span>
              <span className="mt-0.5 block text-[11px] text-ink-meta">Alerts and the One Child watchlist</span>
            </span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
          </Link>
        ) : null}

        <div className={rowClass.replace('hover:border-bloom-green', '')}>
          <Link to="/bridge" className="min-w-0">
            <span className="block text-[13.5px] font-semibold">Friday Bridge digest</span>
            <span className="mt-0.5 block text-[11px] text-ink-meta">Read this week's digest · toggle the Friday reminder</span>
          </Link>
          <Toggle
            checked={prefs?.bridgeDigest ?? true}
            onChange={async () => {
              const next = !(prefs?.bridgeDigest ?? true)
              setPrefs({ bridgeDigest: next })
              await Api.savePrefs(next)
            }}
            label="Friday Bridge digest reminder"
          />
        </div>

        <dl className="rounded-[16px] border border-bloom-line bg-white px-4 py-1">
          {[
            ['School type', me.school.schoolType ?? '—'],
            ['Board', me.school.board ?? '—'],
            ['Location', me.school.location ?? '—'],
          ].map(([label, value], i, arr) => (
            <div key={label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-bloom-cream-dim' : ''}`}>
              <dt className="micro-label text-ink-meta">{label}</dt>
              <dd className="m-0 text-[12.5px] font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        {canEdit ? (
          <button
            onClick={() => setPerksOpen(true)}
            className="flex min-h-[52px] items-center gap-2.5 rounded-[16px] bg-linear-135 from-bloom-gold to-bloom-gold-bright px-4 py-3.5 text-left text-ink transition-transform duration-150 hover:scale-[1.01]"
          >
            <Flower2 aria-hidden="true" className="h-4.5 w-4.5" />
            <span className="flex-1 text-sm font-extrabold">Teacher Perks</span>
            <span className="rounded-full bg-bloom-charcoal px-2.5 py-1 text-[10.5px] font-extrabold text-bloom-gold-bright">Sample</span>
          </button>
        ) : null}

        {me.role === 'leader' ? (
          <button
            onClick={async () => {
              const data = await Api.bscExport()
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `bloom-bsc-export-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className={rowClass}
          >
            <span>
              <span className="block text-[13.5px] font-semibold">BSC dashboard export</span>
              <span className="mt-0.5 block text-[11px] text-ink-meta">Spec § 7 JSON from this week's real rollups</span>
            </span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
          </button>
        ) : null}

        <FeedbackRow />

        <section className="rounded-[16px] border border-bloom-line bg-white px-4 py-3.5">
          <h2 className="text-[13.5px] font-semibold">Privacy</h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-meta">
            Voices are anonymised. Free text signalling concern is read only by the school's Pastoral Champion within 24
            hours. Pupils are referenced by handles, never names. Aggregates are released by the school server only above
            the 20-voice threshold.
          </p>
        </section>

        <button onClick={store.logout} className={rowClass}>
          <span className="text-[13.5px] font-semibold text-ink-burgundy">Sign out</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
        </button>

        <p className="py-1.5 pb-4 text-center text-[10.5px] text-ink-meta">
          Bloom · BLOOM Foundation · Trinidad &amp; Tobago · v2.1 · Every Child, Every Chance
        </p>
      </div>

      <Sheet open={perksOpen} onClose={() => setPerksOpen(false)} label="Teacher Perks">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Teacher Perks</h2>
          <button
            onClick={() => setPerksOpen(false)}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full bg-bloom-sand text-ink-meta transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-meta">
          <b>Sample content</b> — partner perks are illustrative until the pilot's partner agreements are in place.
        </p>
        <ul className="mt-3.5 flex flex-col gap-2">
          {TEACHER_PERKS.map((perk) => (
            <li key={perk.title} className="flex items-center gap-3 rounded-row border border-bloom-line bg-white px-3.5 py-3">
              <Flower2 aria-hidden="true" className="h-4 w-4 flex-none text-bloom-gold" />
              <div className="flex-1">
                <div className="text-[13px] font-bold">{perk.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-meta">{perk.sub}</div>
              </div>
              <StatusBadge tone="gold">Sample</StatusBadge>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
