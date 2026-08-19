import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Flower2 } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { Card, MicroLabel, PageHeader, StatusBadge } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { Sheet } from '../components/Sheet'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../SessionContext'
import { ROLE_LABELS, signOut } from '../services/auth'
import { generateBridge, type BridgeDigest } from '../services/bridge'
import { storage } from '../services/storage'
import { SCHOOL_CONFIG } from '../services/time'
import { TEACHER_PERKS } from '../data/microShots'

const BRIDGE_TOGGLE_KEY = 'bridgeDigestEnabled'

export function Profile() {
  const { session, refreshSession } = useSession()
  const navigate = useNavigate()
  const [perksOpen, setPerksOpen] = useState(false)
  const [bridgeOpen, setBridgeOpen] = useState(false)
  const [bridge, setBridge] = useState<BridgeDigest | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const { data, loading, error, reload } = useAsync(() => ({
    bridgeEnabled: storage.get<boolean>(BRIDGE_TOGGLE_KEY) ?? true,
  }))
  const [bridgeEnabled, setBridgeEnabled] = useState<boolean | null>(null)

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const isStaff = session.role !== 'student'
  const enabled = bridgeEnabled ?? data.bridgeEnabled

  return (
    <Screen>
      <PageHeader title="Profile" subtitle={`${SCHOOL_CONFIG.schoolName} · ${ROLE_LABELS[session.role]}`} />
      <div className="flex flex-col gap-2 px-4 pt-3.5 md:grid md:grid-cols-2 md:items-start md:px-0">
        <div className="flex flex-col gap-2">
          <Card className="flex items-center gap-3 !rounded-2xl !p-3.5">
            <span
              aria-hidden="true"
              className="font-display grid h-10 w-10 flex-none place-items-center rounded-full bg-green text-[15px] font-extrabold text-gold-bright"
            >
              {session.initials}
            </span>
            <span>
              <span className="block text-sm font-bold">{session.name}</span>
              <span className="mt-0.5 block text-[11.5px] text-meta">{session.subtitle}</span>
            </span>
          </Card>

          {isStaff && (
            <Link
              to="/pulse/manage"
              className="flex min-h-12 items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-3.5 hover:border-green"
            >
              <span className="text-[13.5px] font-semibold">Carousel questions</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-meta" />
            </Link>
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3.5 py-3.5">
            <div>
              <div className="text-[13.5px] font-semibold">Friday Bridge digest</div>
              <div className="mt-0.5 text-[11px] text-meta">A weekly read of what your week revealed</div>
              {isStaff && (
                <button
                  type="button"
                  className="mt-1.5 min-h-11 text-[11px] font-bold text-green underline underline-offset-2"
                  onClick={() => {
                    setBridge(generateBridge())
                    setBridgeOpen(true)
                  }}
                >
                  View this week's Bridge
                </button>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Friday Bridge digest notifications"
              onClick={() => {
                const next = !enabled
                storage.set(BRIDGE_TOGGLE_KEY, next)
                setBridgeEnabled(next)
              }}
              className={`hit-target relative h-6 w-10 flex-none rounded-chip transition-colors ${enabled ? 'bg-green' : 'bg-line-strong'}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${enabled ? 'left-[19px]' : 'left-[3px]'}`}
              />
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-white px-3.5 py-1">
            {[
              ['School type', 'Secondary'],
              ['Board', 'Catholic · CEBM'],
              ['Location', 'Port of Spain'],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-cream-dim' : ''}`}
              >
                <span className="micro-label !tracking-[0.1em] text-meta">{label}</span>
                <span className="text-[12.5px] font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {session.role === 'teacher' && (
            <button
              type="button"
              onClick={() => setPerksOpen(true)}
              className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-gradient-to-br from-gold to-gold-bright px-3.5 py-3.5 text-left text-ink hover:brightness-95"
            >
              <Flower2 aria-hidden="true" className="h-4 w-4" />
              <span className="flex-1 text-sm font-extrabold">Teacher Perks</span>
              <span className="rounded-chip bg-charcoal px-2.5 py-1 text-[10.5px] font-extrabold text-gold-bright">
                {TEACHER_PERKS.length} New
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFeedbackSent((v) => !v)}
            className="flex min-h-12 items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-3.5 text-left hover:border-green"
          >
            <span className="text-[13.5px] font-semibold">{feedbackSent ? 'Feedback sent — thank you ✓' : 'Send feedback'}</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-meta" />
          </button>

          <div className="rounded-2xl border border-line bg-white px-3.5 py-3.5">
            <h2 className="text-[13.5px] font-semibold">Privacy</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-meta">
              Voices are anonymised. Free text signalling concern is read only by the school's Pastoral Champion within
              24 hours. Pupils are referenced by handles, never names. Insights appear only above the 20-voice
              threshold.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              signOut()
              refreshSession()
              navigate('/')
            }}
            className="flex min-h-12 items-center justify-between rounded-2xl border border-line bg-white px-3.5 py-3.5 text-left hover:border-green"
          >
            <span className="text-[13.5px] font-semibold">Sign out · switch role</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-meta" />
          </button>

          <p className="py-1.5 text-center text-[10.5px] text-meta">
            Bloom · BLOOM Foundation · Trinidad &amp; Tobago · v2.0 · Every Child, Every Chance
          </p>
        </div>
      </div>

      <Sheet open={perksOpen} onClose={() => setPerksOpen(false)} title="Teacher Perks">
        <p className="mt-1 text-xs text-meta">Earned by your 12-day pulse streak · thank you for showing up</p>
        <ul className="mt-3.5 flex list-none flex-col gap-2">
          {TEACHER_PERKS.map((perk) => (
            <li key={perk.title} className="flex items-center gap-2.5 rounded-input border border-line bg-white px-3.5 py-3">
              <Flower2 aria-hidden="true" className="h-4 w-4 flex-none text-gold" />
              <span className="flex-1">
                <span className="block text-[13px] font-bold">{perk.title}</span>
                <span className="mt-0.5 block text-[11px] text-meta">{perk.sub}</span>
              </span>
              <StatusBadge tone="gold">NEW</StatusBadge>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={bridgeOpen} onClose={() => setBridgeOpen(false)} title="This week's Bridge">
        {bridge && (
          <div className="mt-2 flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            {session.role === 'leader' ? (
              <>
                <BridgeSection label="Synodal read of the week" text={bridge.leader.synodalRead} />
                <BridgeSection label="Champion attention" text={bridge.leader.championAttention} />
                <BridgeSection label="BSC implication" text={bridge.leader.bscImplication} />
              </>
            ) : (
              <>
                <BridgeSection label="What your week revealed" text={bridge.teacher.weekRevealed} />
                <BridgeSection label="What next week might hold" text={bridge.teacher.nextWeek} />
                <BridgeSection label="One sentence to take home" text={bridge.teacher.takeHome} />
              </>
            )}
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

function BridgeSection({ label, text }: { label: string; text: string }) {
  return (
    <section className="rounded-input border border-line bg-white px-3.5 py-3">
      <MicroLabel className="text-meta">{label}</MicroLabel>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{text}</p>
    </section>
  )
}
