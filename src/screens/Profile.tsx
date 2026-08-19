import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Flower2, X } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { SCHOOL_NAME } from '../components/AppShell'
import { Sheet } from '../components/Sheet'
import { PageHeader, ScreenSkeleton, StatusBadge, Toggle } from '../components/ui'
import { useLoaded } from '../hooks/useLoaded'
import { TEACHER_PERKS } from '../data/shots'

const PROFILE = {
  student: { name: 'Student F2-104', sub: 'Form 2 · handle, never your name', init: 'F2' },
  teacher: { name: 'M. Persaud', sub: 'Form teacher · 12-day streak', init: 'MP' },
  leader: { name: 'Sr. A. Joseph', sub: 'Principal · Pastoral Champion', init: 'AJ' },
}

const ROLE_CHIP = { student: 'Student · Form 2', teacher: 'Teacher · Form 2', leader: 'Leader · Principal' }

export function Profile() {
  const store = useAppStore()
  const loaded = useLoaded()
  const [perksOpen, setPerksOpen] = useState(false)
  const role = store.account!.role
  const canEdit = role !== 'student'
  const me = PROFILE[role]

  if (!loaded) return <ScreenSkeleton />

  const rowClass =
    'flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[16px] border border-bloom-line bg-white px-4 py-3.5 text-left transition-colors hover:border-bloom-green'

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Profile" sub={`${SCHOOL_NAME} · ${ROLE_CHIP[role]}`} />
      <div className="flex flex-col gap-2 px-4 md:max-w-xl md:px-0">
        <div className="flex items-center gap-3 rounded-[16px] border border-bloom-line bg-white px-4 py-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-bloom-green font-display text-[19px] font-extrabold text-bloom-gold-bright">
            {me.init}
          </span>
          <div>
            <div className="text-sm font-bold">{me.name}</div>
            <div className="text-[11.5px] text-ink-meta">{me.sub}</div>
          </div>
        </div>

        {canEdit ? (
          <Link to="/manage" className={rowClass}>
            <span className="text-[13.5px] font-semibold">Carousel questions</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
          </Link>
        ) : null}

        {role === 'leader' ? (
          <Link to="/champion" className={rowClass}>
            <span>
              <span className="block text-[13.5px] font-semibold">Champion workspace</span>
              <span className="mt-0.5 block text-[11px] text-ink-meta">Alerts and the One Child watchlist</span>
            </span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
          </Link>
        ) : null}

        <div className={rowClass.replace('hover:border-bloom-green', '')}>
          <div>
            <div className="text-[13.5px] font-semibold">Friday Bridge digest</div>
            <div className="mt-0.5 text-[11px] text-ink-meta">A weekly read of what your week revealed</div>
          </div>
          <Toggle checked={store.bridgeDigest} onChange={store.toggleBridgeDigest} label="Friday Bridge digest" />
        </div>

        <dl className="rounded-[16px] border border-bloom-line bg-white px-4 py-1">
          {[
            ['School type', 'Secondary'],
            ['Board', 'Catholic · CEBM'],
            ['Location', 'Port of Spain'],
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
            <span className="rounded-full bg-bloom-charcoal px-2.5 py-1 text-[10.5px] font-extrabold text-bloom-gold-bright">4 New</span>
          </button>
        ) : null}

        <button onClick={store.sendFeedback} className={rowClass} disabled={store.feedbackSent}>
          <span aria-live="polite" className="text-[13.5px] font-semibold">
            {store.feedbackSent ? 'Feedback sent — thank you ✓' : 'Send feedback'}
          </span>
          {store.feedbackSent ? null : <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />}
        </button>

        <section className="rounded-[16px] border border-bloom-line bg-white px-4 py-3.5">
          <h2 className="text-[13.5px] font-semibold">Privacy</h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-meta">
            Voices are anonymised. Free text signalling concern is read only by the school's Pastoral Champion within 24
            hours. Pupils are referenced by handles, never names. Insights appear only above the 20-voice threshold.
          </p>
        </section>

        <button onClick={store.signOut} className={rowClass}>
          <span className="text-[13.5px] font-semibold text-ink-burgundy">Sign out · switch role</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-meta" />
        </button>

        <p className="py-1.5 pb-4 text-center text-[10.5px] text-ink-meta">
          Bloom · BLOOM Foundation · Trinidad &amp; Tobago · v2.0 · Every Child, Every Chance
        </p>
      </div>

      <Sheet open={perksOpen} onClose={() => setPerksOpen(false)} label="Teacher Perks">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Teacher Perks</h2>
          <button
            onClick={() => setPerksOpen(false)}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-bloom-sand text-ink-meta transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-meta">Earned by your 12-day pulse streak · thank you for showing up</p>
        <ul className="mt-3.5 flex flex-col gap-2">
          {TEACHER_PERKS.map((perk) => (
            <li key={perk.title} className="flex items-center gap-3 rounded-row border border-bloom-line bg-white px-3.5 py-3">
              <Flower2 aria-hidden="true" className="h-4 w-4 flex-none text-bloom-gold" />
              <div className="flex-1">
                <div className="text-[13px] font-bold">{perk.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-meta">{perk.sub}</div>
              </div>
              <StatusBadge tone="gold">New</StatusBadge>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
