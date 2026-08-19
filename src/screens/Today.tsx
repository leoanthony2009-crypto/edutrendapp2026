import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { SCHOOL_NAME } from '../components/AppShell'
import { Card, DarkCard, GoldCard, GreenCard, GoldButton, MicroLabel, PageHeader, PrivacyNote, ScreenSkeleton } from '../components/ui'
import { SurveyBuilderPromoCard, WorthNoticingCard } from '../components/cards'
import { TellALeaderSheet } from '../components/TellALeaderSheet'
import { useLoaded } from '../hooks/useLoaded'
import { collatedToday, LESSONS_DISTRIBUTION, PULSE_7D, SEED_WATCHLIST_NOTE, UNHEARD_COHORTS } from '../data/demoAggregates'
import { watchlist } from '../services/champion'
import { pickFallbackMove } from '../services/poui'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

export function Today() {
  const { account } = useAppStore()
  const loaded = useLoaded()
  if (!loaded) return <ScreenSkeleton />
  switch (account!.role) {
    case 'student':
      return <TodayStudent />
    case 'teacher':
      return <TodayTeacher />
    case 'leader':
      return <TodayLeader />
  }
}

/* ── Student ───────────────────────────────────────────────────────────── */

function TodayStudent() {
  const store = useAppStore()
  const navigate = useNavigate()
  const submitted = Boolean(store.todayRun('student'))
  const count = store.todaysQuestions('student').length
  const streak = 6 + (submitted ? 1 : 0)

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Your voice today" sub={`Form 2 · ${SCHOOL_NAME}`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <GreenCard className="md:col-span-2">
          <h2 className="font-display text-lg leading-snug font-bold text-pretty">
            {submitted ? 'Thank you — your voice was heard today.' : 'Five quick questions. Say how today really felt.'}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-on-dark-soft">
            {submitted
              ? 'Your answers joined 164 other voices. Adults see patterns, never names.'
              : 'It takes about two minutes. You can skip anything, and "prefer not to say" is always okay.'}
          </p>
          <GoldButton className="mt-3.5 text-[13.5px]" onClick={() => navigate('/pulse')}>
            {submitted ? 'See or change my answers' : 'Start · Your Voice Today'}
          </GoldButton>
        </GreenCard>

        <div className="flex gap-2.5">
          <Card className="flex-1 !p-3.5">
            <div className="font-display text-[22px] font-extrabold text-bloom-green">{streak}</div>
            <div className="text-[11px] text-ink-meta">days in a row your voice was heard</div>
          </Card>
          <Card className="flex-1 !p-3.5">
            <div className="font-display text-[22px] font-extrabold text-bloom-gold">2 min</div>
            <div className="text-[11px] text-ink-meta">is all it takes — {count} questions today</div>
          </Card>
        </div>

        <PrivacyNote>
          <b>Private by design.</b> Teachers see class patterns, never your name next to an answer. If something worries an
          adult who should help, only your school's Pastoral Champion is told.
        </PrivacyNote>

        <Card className="md:col-span-2">
          <MicroLabel className="text-ink-meta">This week in your school</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
            More students said someone made their day better — the Form 1 buddy scheme is working. Thanks for speaking up.
          </p>
        </Card>
      </div>
    </div>
  )
}

/* ── Teacher ───────────────────────────────────────────────────────────── */

function PulseScoreCard({ forLeader = false }: { forLeader?: boolean }) {
  const store = useAppStore()
  const run = store.todayRun(forLeader ? 'leader' : 'teacher')
  const today = collatedToday(run?.score)
  const series = [...PULSE_7D, today]
  const delta = today - PULSE_7D[PULSE_7D.length - 1]
  const state = delta >= 2 ? 'LIFTING' : delta <= -2 ? 'NEEDS ATTENTION' : 'STEADY'

  return (
    <GreenCard className="relative overflow-hidden">
      <span aria-hidden="true" className="absolute -top-5 -right-5 h-24 w-24 rounded-full bg-bloom-gold-bright/12" />
      <MicroLabel className="text-bloom-gold">Pastoral Pulse · {state}</MicroLabel>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-[40px] font-extrabold text-bloom-gold-bright">{today}</span>
        <span className="text-xs text-on-dark-soft">
          / 100 · {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs last week
        </span>
      </div>
      <div
        className="mt-2 flex h-[30px] items-end gap-1"
        role="img"
        aria-label={`Pulse over the last 7 school days: ${series.join(', ')} out of 100. Today is ${today}.`}
      >
        {series.map((v, i) => (
          <span
            key={i}
            className={`flex-1 rounded-[3px] ${i === series.length - 1 ? 'bg-bloom-gold-bright' : 'bg-on-dark/30'}`}
            style={{ height: `${Math.round(v * 0.42)}px` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-on-dark-soft">
        {run ? 'Includes your pulse from today ✓' : 'Your pulse is not in yet — it takes two minutes.'}
      </p>
    </GreenCard>
  )
}

function PouiMicroMoveCard() {
  const store = useAppStore()
  const move = store.microMove?.text ?? pickFallbackMove('wellness', 'R', 'noticing')
  const reason = store.microMove?.reason ?? "Suggested because today felt heavy in your class's pulses."

  return (
    <GoldCard>
      <MicroLabel className="text-ink-gold">POUI micro-move</MicroLabel>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A4636] italic">"{move}"</p>
      <p className="mt-1.5 text-[11px] text-ink-meta">{reason}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          onClick={store.toggleTried}
          aria-pressed={store.moveTried}
          className={`min-h-11 rounded-[10px] px-3.5 py-2 text-[11.5px] font-bold transition-colors duration-150 ${
            store.moveTried ? 'bg-bloom-green text-on-dark' : 'bg-bloom-gold-chip text-ink-gold hover:bg-bloom-gold-line'
          }`}
        >
          {store.moveTried ? 'Tried ✓' : 'Mark as tried'}
        </button>
        <button
          onClick={store.toggleSaved}
          aria-pressed={store.moveSaved}
          className="min-h-11 rounded-[10px] border border-bloom-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
        >
          {store.moveSaved ? 'Saved ✓' : 'Save'}
        </button>
        <a
          href={POUI_GPT_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-bloom-charcoal px-3.5 py-2 text-[11.5px] font-extrabold text-bloom-gold-bright no-underline hover:bg-black"
        >
          Ask POUI GPT <ExternalLink aria-hidden="true" className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-meta">
        POUI GPT generates more micro-moves from your pulse responses, grounded in Bloom's research base. Opens outside
        Bloom, in ChatGPT.
      </p>
    </GoldCard>
  )
}

function WatchlistCard({ leader = false }: { leader?: boolean }) {
  const rows = watchlist()
  return (
    <DarkCard>
      <MicroLabel className="text-mark-selfemptying">{leader ? 'Champion watchlist' : 'One Child · Watchlist'}</MicroLabel>
      {rows.length > 0 ? (
        <ul className="mt-1.5 space-y-1.5">
          {rows.slice(0, 3).map((r) => (
            <li key={r.pupilHandle} className="text-[13px] leading-snug">
              <b>{r.pupilHandle}</b> noted by {r.staff} staff across {r.days} days.
              {leader ? '' : ' Your Champion reads within 24 hours.'}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[13px] leading-relaxed">
          {leader ? (
            <>
              <b>3 pupils</b> on the watchlist · 1 new this week · all acknowledged within 24h.
            </>
          ) : (
            <>
              <b>{SEED_WATCHLIST_NOTE.handle}</b> noted by {SEED_WATCHLIST_NOTE.staff} staff across {SEED_WATCHLIST_NOTE.days}{' '}
              days. Your Champion reads within 24 hours.
            </>
          )}
        </p>
      )}
    </DarkCard>
  )
}

function TodayTeacher() {
  const store = useAppStore()
  const [tellOpen, setTellOpen] = useState(false)
  const submitted = Boolean(store.todayRun('teacher'))

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Today's Insights" sub={`Pastoral Pulse · You + 164 · updated ${submitted ? 'just now' : '3:40 pm'}`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <div className="space-y-3">
          <PulseScoreCard />
          <Card>
            <div className="flex justify-between gap-2">
              <h2 className="text-[14.5px] leading-snug font-semibold">Did today's lessons make sense to your class?</h2>
              <span
                title="Learning"
                aria-label="Theme: Learning"
                className="flex-none self-start rounded-md bg-signal-good px-1.5 py-1 text-[10px] font-extrabold text-white"
              >
                L
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {LESSONS_DISTRIBUTION.map((row) => (
                <div key={row.label} className="grid grid-cols-[64px_1fr_36px] items-center gap-2">
                  <span className="text-right text-[11px] text-ink-meta">{row.label}</span>
                  <div className="h-[11px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${row.label}: ${row.pct} percent`}>
                    <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-ink-soft">{row.pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-meta">{164 + (submitted ? 1 : 0)} voices · school average 71%</p>
          </Card>
          <WorthNoticingCard
            body="Several pupils who reported low belonging this week also said they were unsure who they could speak to. A gentle check-in may help — Bloom never diagnoses the reason."
            chips={[{ label: 'Low belonging' }, { label: '+ No trusted adult' }, { label: '7 pupils · anonymised', muted: true }]}
          />
        </div>
        <div className="space-y-3">
          <PouiMicroMoveCard />
          <WatchlistCard />
          <SurveyBuilderPromoCard role="teacher" />
          <button
            onClick={() => setTellOpen(true)}
            className="min-h-11 px-1 text-left text-xs text-ink-burgundy underline underline-offset-[3px]"
          >
            Tell a leader · 24-hour Champion read
          </button>
        </div>
      </div>
      <TellALeaderSheet open={tellOpen} onClose={() => setTellOpen(false)} />
    </div>
  )
}

/* ── Leader ────────────────────────────────────────────────────────────── */

function TodayLeader() {
  const navigate = useNavigate()
  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Leadership view" sub={`${SCHOOL_NAME} · 612 pupils · 38 staff · updated 3:40 pm`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <div className="space-y-3">
          <DarkCard>
            <MicroLabel className="text-bloom-gold-bright">Perception gap · Safety</MicroLabel>
            <div className="mt-2.5 flex gap-3.5">
              <div className="flex-1">
                <div className="font-display text-[26px] font-extrabold text-bloom-gold-bright">84%</div>
                <div className="text-[10.5px] text-on-dark-meta">staff believe pupils feel safe</div>
              </div>
              <div className="flex-1">
                <div className="font-display text-[26px] font-extrabold text-[#F0967F]">67%</div>
                <div className="text-[10.5px] text-on-dark-meta">pupils say they felt safe this week</div>
              </div>
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-on-dark-soft">
              The gap is widest in Forms 2–3, around break times. Neither view is treated as automatically correct.
            </p>
          </DarkCard>
          <Card>
            <h2 className="text-sm font-semibold">Whose voice are we least likely to have heard?</h2>
            <div className="mt-2.5 flex flex-col gap-2">
              {UNHEARD_COHORTS.map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_80px_38px] items-center gap-2">
                  <span className="text-[12.5px] font-semibold">{row.label}</span>
                  <div className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${row.label}: ${row.pct} percent participation`}>
                    <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-ink-meta">{row.pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-ink-meta">Participation in this week's Voice carousel, by cohort</p>
          </Card>
          <WorthNoticingCard
            body='Pupils saying "I don&apos;t want to come tomorrow" this week mostly also reported lessons not making sense — this looks like a learning-support signal, not (yet) a safety one.'
            chips={[{ label: 'Attendance pull ↓' }, { label: '+ Lessons unclear' }, { label: 'Form 3 · 20+ pupils', muted: true }]}
          />
        </div>
        <div className="space-y-3">
          <WatchlistCard leader />
          <GoldCard>
            <MicroLabel className="text-ink-gold">One small change to test tomorrow</MicroLabel>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A4636] italic">
              "Open the library at first break for Forms 2–3 — the pulses point to break time as where safety dips."
            </p>
            <button
              onClick={() => navigate('/pulse')}
              className="mt-2.5 min-h-11 rounded-[10px] bg-bloom-green px-3.5 py-2 text-[11.5px] font-bold text-on-dark transition-colors hover:bg-bloom-green-deep"
            >
              Answer this week's Leader Pulse →
            </button>
          </GoldCard>
          <SurveyBuilderPromoCard role="leader" />
        </div>
      </div>
    </div>
  )
}
