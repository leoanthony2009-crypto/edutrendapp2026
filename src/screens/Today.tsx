import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { Card, MicroLabel, PageHeader, PrivacyIndicator, ProgressBar, ThemeBadge } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { TellALeaderSheet } from '../components/TellALeaderSheet'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../SessionContext'
import { getCurrentSubmission, getPulsesCompleted, getStreak, getTodayQuestions, UNLOCK_THRESHOLD } from '../services/pulses'
import { getTodayMicroMove, updateMicroMove } from '../services/poui'
import { getWatchlist } from '../services/champion'
import { getTrendSeries, todayScore, voicesToday, weekDelta } from '../services/trends'
import { SCHOOL_CONFIG } from '../services/time'
import type { MicroMove } from '../types/pulse'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

export function Today() {
  const { session } = useSession()
  if (session.role === 'student') return <StudentToday />
  if (session.role === 'teacher') return <TeacherToday />
  return <LeaderToday />
}

// ---------- Survey Builder promo card (teacher + leader Today) ----------

function BuilderPromoCard({ completed }: { completed: number }) {
  const unlocked = completed >= UNLOCK_THRESHOLD
  const remaining = Math.max(0, UNLOCK_THRESHOLD - completed)
  return (
    <Link
      to="/builder"
      className="relative block overflow-hidden rounded-card bg-gradient-to-br from-green-deep to-green p-4 text-ondark"
    >
      <div aria-hidden="true" className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gold-bright/10" />
      <span className="inline-block rounded-md bg-gold-bright px-2 py-1 text-[9.5px] font-extrabold tracking-[0.14em] text-ink">
        SURVEY BUILDER
      </span>
      <div className="font-display mt-2 text-lg font-extrabold">Launch your own survey</div>
      <p className="mt-1 text-xs leading-relaxed text-ondark-soft">
        {unlocked
          ? 'Turn your idea into a live pulse for your class or school. Results collate in Trends within 24 hours.'
          : 'Build and launch your own pulses. Unlocks after 10 completed pulses — keep answering.'}
      </p>
      <ProgressBar
        value={Math.min(completed, UNLOCK_THRESHOLD)}
        max={UNLOCK_THRESHOLD}
        label={`Survey Builder unlock progress: ${Math.min(completed, UNLOCK_THRESHOLD)} of ${UNLOCK_THRESHOLD} pulses completed`}
        className="mt-2.5 !h-1.5"
        trackClass="bg-ondark/15"
        barClass="bg-gold-bright"
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-ondark-soft">
        <span>{unlocked ? 'Unlocked ✓' : `${Math.min(completed, UNLOCK_THRESHOLD)} of ${UNLOCK_THRESHOLD} pulses completed`}</span>
        <span className="font-extrabold text-ondark-gold">{unlocked ? 'Open →' : `${remaining} to go`}</span>
      </div>
    </Link>
  )
}

// ---------- Student ----------

function StudentToday() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => ({
    submitted: getCurrentSubmission('student') !== null,
    streak: getStreak(),
    questionCount: getTodayQuestions('student').length,
    voices: voicesToday(),
  }))

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  return (
    <Screen>
      <PageHeader title="Your voice today" subtitle={`Form 2 · ${SCHOOL_CONFIG.schoolName}`} />
      <div className="grid gap-3 px-4 pt-3.5 md:grid-cols-2 md:px-0">
        <div className="flex flex-col gap-3">
          <section className="rounded-card bg-green p-[18px] text-ondark" aria-label="Today's pulse">
            <h2 className="font-display text-lg font-bold leading-snug">
              {data.submitted
                ? 'Thank you — your voice was heard today.'
                : `${['Three', 'Four', 'Five'][data.questionCount - 3] ?? 'A few'} quick questions. Say how today really felt.`}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ondark-soft">
              {data.submitted
                ? `Your answers joined ${data.voices - 1} other voices. Adults see patterns, never names.`
                : 'It takes about two minutes. You can skip anything, and "prefer not to say" is always okay.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/pulse')}
              className="mt-3.5 inline-flex min-h-11 items-center rounded-row bg-gold-bright px-5 py-3 text-[13.5px] font-extrabold text-ink hover:brightness-95"
            >
              {data.submitted ? 'See or change my answers' : 'Start · Your Voice Today'}
            </button>
          </section>

          <div className="flex gap-2.5">
            <Card className="flex-1 !rounded-2xl !p-3.5">
              <div className="font-display text-[22px] font-extrabold text-green">{data.streak}</div>
              <div className="text-[11px] text-meta">days in a row your voice was heard</div>
            </Card>
            <Card className="flex-1 !rounded-2xl !p-3.5">
              <div className="font-display text-[22px] font-extrabold text-gold-ink">2 min</div>
              <div className="text-[11px] text-meta">
                is all it takes — {data.questionCount} question{data.questionCount === 1 ? '' : 's'} today
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <PrivacyIndicator>
            <b>Private by design.</b> Teachers see class patterns, never your name next to an answer. If something
            worries an adult who should help, only your school's Pastoral Champion is told.
          </PrivacyIndicator>
          <Card>
            <MicroLabel className="text-meta">This week in your school</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              More students said someone made their day better — the Form 1 buddy scheme is working. Thanks for
              speaking up.
            </p>
          </Card>
        </div>
      </div>
    </Screen>
  )
}

// ---------- Teacher ----------

const DEFAULT_MOVE: MicroMove = {
  text: "Tomorrow's first ten minutes — water, windows, a song they choose.",
  reason: "Suggested because today felt heavy in your class's pulses.",
  tried: false,
  saved: false,
  date: '',
}

function TeacherToday() {
  const [tellOpen, setTellOpen] = useState(false)
  const [move, setMove] = useState<MicroMove | null>(null)
  const { data, loading, error, reload } = useAsync(() => {
    const series = getTrendSeries('7d')
    return {
      submitted: getCurrentSubmission('teacher') !== null,
      score: todayScore(),
      delta: weekDelta(),
      spark: series.points,
      voices: voicesToday(),
      completed: getPulsesCompleted('teacher'),
      microMove: getTodayMicroMove() ?? DEFAULT_MOVE,
      watchlistTop: getWatchlist()[0] ?? null,
    }
  })

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const shownMove = move ?? data.microMove
  const state = data.delta >= 2 ? 'LIFTING' : data.delta <= -2 ? 'NEEDS ATTENTION' : 'STEADY'
  const maxSpark = Math.max(...data.spark.map((p) => p.value))

  const toggleMove = (patch: { tried?: boolean; saved?: boolean }) => {
    const next = updateMicroMove(patch)
    setMove(next ?? { ...shownMove, ...patch })
  }

  return (
    <Screen>
      <PageHeader title="Today's Insights" subtitle={`Pastoral Pulse · You + ${data.voices - 1} · updated just now`} />
      <div className="grid gap-3 px-4 pt-3.5 md:grid-cols-2 md:px-0">
        <div className="flex flex-col gap-3">
          <section className="relative overflow-hidden rounded-card bg-green p-4 text-ondark" aria-label="Pastoral Pulse score">
            <div aria-hidden="true" className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-gold-bright/10" />
            <MicroLabel className="text-gold">Pastoral Pulse · {state}</MicroLabel>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-[40px] font-extrabold text-gold-bright">{data.score}</span>
              <span className="text-xs text-ondark-soft">
                / 100 · {data.delta >= 0 ? '▲' : '▼'} {Math.abs(data.delta)} vs last week
              </span>
            </div>
            <div
              className="mt-2 flex h-8 items-end gap-1"
              role="img"
              aria-label={`Last 7 days pulse scores: ${data.spark.map((p) => `${p.label} ${p.value}`).join(', ')}`}
            >
              {data.spark.map((p, i) => (
                <div
                  key={p.label + i}
                  className={`flex-1 rounded-[3px] ${i === data.spark.length - 1 ? 'bg-gold-bright' : 'bg-ondark/30'}`}
                  style={{ height: `${Math.round((p.value / maxSpark) * 100)}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ondark-soft">
              {data.submitted ? 'Includes your pulse from today ✓' : 'Your pulse is not in yet — it takes two minutes.'}
            </p>
          </section>

          <Card>
            <div className="flex justify-between gap-2">
              <h2 className="text-[14.5px] font-semibold leading-snug">Did today's lessons make sense to your class?</h2>
              <ThemeBadge theme="Learning" mark="D" className="flex-none self-start" />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {[
                { label: 'Mostly', pct: 48, color: 'var(--color-good)' },
                { label: 'Some', pct: 29, color: 'var(--color-gold)' },
                { label: 'Hardly', pct: 15, color: 'var(--color-warn)' },
                { label: 'Not at all', pct: 8, color: 'var(--color-concern)' },
              ].map((r) => (
                <div key={r.label} className="grid grid-cols-[64px_1fr_38px] items-center gap-2">
                  <span className="text-right text-[11px] text-meta">{r.label}</span>
                  <div className="h-[11px] overflow-hidden rounded-chip bg-cream-dim">
                    <div className="h-full rounded-chip" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-ink-soft">{r.pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-meta">{data.voices} voices · school average 71%</p>
          </Card>

          <Card className="!border-[#DCD3E8]">
            <MicroLabel className="text-selfempty-deep">Worth noticing</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Several pupils who reported low belonging this week also said they were unsure who they could speak to. A
              gentle check-in may help — Bloom never diagnoses the reason.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-chip bg-selfempty-tint px-2.5 py-1 text-[11px] font-semibold text-selfempty-deep">Low belonging</span>
              <span className="rounded-chip bg-selfempty-tint px-2.5 py-1 text-[11px] font-semibold text-selfempty-deep">+ No trusted adult</span>
              <span className="rounded-chip bg-cream-dim px-2.5 py-1 text-[11px] font-semibold text-meta">7 pupils · anonymised</span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <section className="rounded-card border border-gold-tint-line bg-gold-tint p-4" aria-label="POUI micro-move">
            <MicroLabel className="text-gold-ink">POUI micro-move</MicroLabel>
            <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-ink-soft">"{shownMove.text}"</p>
            <p className="mt-1.5 text-[11px] text-meta">{shownMove.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={shownMove.tried}
                onClick={() => toggleMove({ tried: !shownMove.tried })}
                className={`min-h-11 rounded-[10px] px-3.5 py-2 text-[11.5px] font-bold transition-colors ${
                  shownMove.tried ? 'bg-green text-ondark' : 'bg-gold-chip text-gold-ink hover:brightness-95'
                }`}
              >
                {shownMove.tried ? 'Tried ✓' : 'Mark as tried'}
              </button>
              <button
                type="button"
                aria-pressed={shownMove.saved}
                onClick={() => toggleMove({ saved: !shownMove.saved })}
                className={`min-h-11 rounded-[10px] border border-line-strong px-3.5 py-2 text-[11.5px] font-bold transition-colors ${
                  shownMove.saved ? 'bg-green text-ondark' : 'text-ink-soft hover:bg-cream-dim'
                }`}
              >
                {shownMove.saved ? 'Saved ✓' : 'Save'}
              </button>
              <a
                href={POUI_GPT_URL}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-[10px] bg-charcoal px-3.5 py-2 text-[11.5px] font-extrabold text-ondark-gold hover:bg-black/80"
              >
                Ask POUI GPT <ExternalLink aria-hidden="true" className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-meta">
              POUI GPT generates more micro-moves from your pulse responses, grounded in Bloom's research base. Opens
              outside Bloom in ChatGPT.
            </p>
          </section>

          <section className="rounded-card bg-charcoal p-4 text-[#EFF3ED]" aria-label="One Child watchlist">
            <MicroLabel className="text-selfempty">One Child · Watchlist</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed">
              {data.watchlistTop ? (
                <>
                  <b>{data.watchlistTop.pupilHandle}</b> noted by {data.watchlistTop.mentionCount} staff across{' '}
                  {data.watchlistTop.dayCount} days. Your Champion reads within 24 hours.
                </>
              ) : (
                'No cross-staff patterns this fortnight. The channel stays open.'
              )}
            </p>
          </section>

          <BuilderPromoCard completed={data.completed} />

          <button
            type="button"
            onClick={() => setTellOpen(true)}
            className="min-h-11 self-start px-1 py-2 text-left text-xs text-safety underline underline-offset-[3px] hover:text-ink"
          >
            Tell a leader · 24-hour Champion read
          </button>
        </div>
      </div>
      <TellALeaderSheet open={tellOpen} onClose={() => setTellOpen(false)} />
    </Screen>
  )
}

// ---------- Leader ----------

function LeaderToday() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => ({
    submitted: getCurrentSubmission('leader') !== null,
    completed: getPulsesCompleted('leader'),
    watchlist: getWatchlist(),
  }))

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  return (
    <Screen>
      <PageHeader title="Leadership view" subtitle={`${SCHOOL_CONFIG.schoolName} · 612 pupils · 38 staff · updated just now`} />
      <div className="grid gap-3 px-4 pt-3.5 md:grid-cols-2 md:px-0">
        <div className="flex flex-col gap-3">
          <section className="rounded-card bg-charcoal p-4 text-[#EFF3ED]" aria-label="Perception gap, safety">
            <MicroLabel className="text-ondark-gold">Perception gap · Safety</MicroLabel>
            <div className="mt-2.5 flex gap-3.5">
              <div className="flex-1">
                <div className="font-display text-[26px] font-extrabold text-gold-bright">84%</div>
                <div className="text-[10.5px] text-[#AFC3B6]">staff believe pupils feel safe</div>
              </div>
              <div className="flex-1">
                <div className="font-display text-[26px] font-extrabold text-[#F0967F]">67%</div>
                <div className="text-[10.5px] text-[#AFC3B6]">pupils say they felt safe this week</div>
              </div>
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ondark-soft">
              The gap is widest in Forms 2–3, around break times. Neither view is treated as automatically correct.
            </p>
          </section>

          <Card>
            <h2 className="text-sm font-semibold">Whose voice are we least likely to have heard?</h2>
            <div className="mt-2.5 flex flex-col gap-2">
              {[
                { label: 'Form 3 boys', pct: 38, color: 'var(--color-concern)' },
                { label: 'New transfers', pct: 46, color: 'var(--color-warn)' },
                { label: 'Form 1', pct: 72, color: 'var(--color-good)' },
                { label: 'Form 5 (SBA term)', pct: 54, color: 'var(--color-gold)' },
              ].map((u) => (
                <div key={u.label} className="grid grid-cols-[1fr_80px_36px] items-center gap-2">
                  <span className="text-[12.5px] font-semibold">{u.label}</span>
                  <div className="h-[9px] overflow-hidden rounded-chip bg-cream-dim">
                    <div className="h-full rounded-chip" style={{ width: `${u.pct}%`, background: u.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-meta">{u.pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-meta">Participation in this week's Voice carousel, by cohort</p>
          </Card>

          <Card className="!border-[#DCD3E8]">
            <MicroLabel className="text-selfempty-deep">Worth noticing</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Pupils saying "I don't want to come tomorrow" this week mostly also reported lessons not making sense —
              this looks like a learning-support signal, not (yet) a safety one.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-chip bg-selfempty-tint px-2.5 py-1 text-[11px] font-semibold text-selfempty-deep">Attendance pull ↓</span>
              <span className="rounded-chip bg-selfempty-tint px-2.5 py-1 text-[11px] font-semibold text-selfempty-deep">+ Lessons unclear</span>
              <span className="rounded-chip bg-cream-dim px-2.5 py-1 text-[11px] font-semibold text-meta">Form 3 · 20+ pupils</span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/watchlist" className="block rounded-card bg-charcoal p-4 text-[#EFF3ED] hover:bg-black/80">
            <MicroLabel className="text-selfempty">Champion watchlist</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed">
              <b>
                {data.watchlist.length} pupil{data.watchlist.length === 1 ? '' : 's'}
              </b>{' '}
              on the watchlist · 1 new this week · all acknowledged within 24h. <span className="font-bold">Open →</span>
            </p>
          </Link>

          <section className="rounded-card border border-gold-tint-line bg-gold-tint p-4" aria-label="One small change to test tomorrow">
            <MicroLabel className="text-gold-ink">One small change to test tomorrow</MicroLabel>
            <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-ink-soft">
              "Open the library at first break for Forms 2–3 — the pulses point to break time as where safety dips."
            </p>
            <button
              type="button"
              onClick={() => navigate('/pulse')}
              className="mt-2.5 inline-flex min-h-11 items-center rounded-[10px] bg-green px-3.5 py-2 text-[11.5px] font-bold text-ondark hover:bg-green-deep"
            >
              {data.submitted ? "This week's Leader Pulse ✓ — review answers" : "Answer this week's Leader Pulse →"}
            </button>
          </section>

          <BuilderPromoCard completed={data.completed} />
        </div>
      </div>
    </Screen>
  )
}
