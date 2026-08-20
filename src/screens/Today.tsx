import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useAppStore, useMe } from '../store/AppStore'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, DarkCard, GoldCard, GreenCard, GoldButton, ErrorState, MicroLabel, PageHeader, PrivacyNote, ScreenSkeleton, StatusBadge } from '../components/ui'
import { SurveyBuilderPromoCard } from '../components/cards'
import { TellALeaderSheet } from '../components/TellALeaderSheet'
import type { AnalyticsSummary } from '../types/api'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

export function Today() {
  const me = useMe()
  switch (me.role) {
    case 'student':
      return <TodayStudent />
    case 'teacher':
      return <TodayTeacher />
    case 'leader':
      return <TodayLeader />
  }
}

/* ── Shared: open surveys to answer ────────────────────────────────────── */

function OpenSurveys() {
  const { data } = useApi(() => Api.surveys(), [])
  const open = (data?.open ?? []).filter((s) => !s.answered)
  if (open.length === 0) return null
  return (
    <Card>
      <MicroLabel className="text-ink-meta">Surveys for you</MicroLabel>
      <ul className="mt-2 flex flex-col gap-2">
        {open.map((s) => (
          <li key={s.id}>
            <Link
              to={`/surveys/${s.id}/answer`}
              className="flex min-h-11 items-center justify-between gap-2 rounded-row border border-bloom-line px-3.5 py-2.5 transition-colors hover:border-bloom-green"
            >
              <span className="text-[13px] font-semibold">{s.title}</span>
              <span className="text-[11px] font-bold text-bloom-green">Answer →</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── Shared: Friday Bridge reminder — honours the Profile preference ───── */

function BridgeReminder() {
  const { data: prefs } = useApi(() => Api.prefs(), [])
  const { data: bridge } = useApi(() => Api.bridge(), [])
  if (!prefs?.bridgeDigest || !bridge?.isFriday) return null
  return (
    <Link to="/bridge" className="block rounded-card border border-bloom-gold-line bg-bloom-gold-tint p-4 transition-colors hover:border-bloom-gold">
      <MicroLabel className="text-ink-gold">Friday Bridge</MicroLabel>
      <p className="mt-1 text-[13px] leading-relaxed text-[#4A4636]">This week's digest is ready — a two-minute read of what the week revealed.</p>
      <span className="mt-1.5 inline-block text-[11.5px] font-extrabold text-bloom-green">Read the Bridge →</span>
    </Link>
  )
}

/* ── Shared: You said → We did (real school actions) ───────────────────── */

function YouSaidWeDid() {
  const { data } = useApi(() => Api.actions(), [])
  const actions = data?.actions ?? []
  if (actions.length === 0) return null
  const latest = actions[0]
  return (
    <Card>
      <MicroLabel className="text-ink-meta">You said → We did</MicroLabel>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
        <b>{latest.signal}</b> → {latest.action}
      </p>
      {actions.length > 1 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-bold text-bloom-green">Earlier changes ({actions.length - 1})</summary>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {actions.slice(1).map((a) => (
              <li key={a.id} className="text-xs leading-relaxed text-ink-soft">
                <b>{a.signal}</b> → {a.action}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  )
}

/* ── Student ───────────────────────────────────────────────────────────── */

function TodayStudent() {
  const store = useAppStore()
  const me = useMe()
  const navigate = useNavigate()
  const [tellOpen, setTellOpen] = useState(false)
  const { today, todayError } = store
  if (todayError) return <ErrorState body="Today could not be loaded. Check your connection and try again." onRetry={store.refreshToday} />
  if (!today) return <ScreenSkeleton />
  const submitted = Boolean(today.run)

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Your voice today" sub={`${me.displayHandle ?? me.name} · ${me.school.name}`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <GreenCard className="md:col-span-2">
          <h2 className="font-display text-lg leading-snug font-bold text-pretty">
            {submitted ? 'Thank you — your voice was heard today.' : `${today.questions.length} quick questions. Say how today really felt.`}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-on-dark-soft">
            {submitted
              ? 'Your answers joined today\'s pulses. Adults see patterns, never names.'
              : 'It takes about two minutes. You can skip anything, and "prefer not to say" is always okay.'}
          </p>
          <GoldButton className="mt-3.5 text-[13.5px]" onClick={() => navigate('/pulse')}>
            {submitted ? 'See or change my answers' : 'Start · Your Voice Today'}
          </GoldButton>
        </GreenCard>

        <div className="flex gap-2.5">
          <Card className="flex-1 !p-3.5">
            <div className="font-display text-[22px] font-extrabold text-bloom-green">{today.streak}</div>
            <div className="text-[11px] text-ink-meta">school days in a row your voice was heard</div>
          </Card>
          <Card className="flex-1 !p-3.5">
            <div className="font-display text-[22px] font-extrabold text-ink-gold">2 min</div>
            <div className="text-[11px] text-ink-meta">is all it takes — {today.questions.length} questions today</div>
          </Card>
        </div>

        <PrivacyNote>
          <b>Private by design.</b> Teachers see class patterns, never your name next to an answer. If something worries an
          adult who should help, only your school's Pastoral Champion is told.
        </PrivacyNote>

        <YouSaidWeDid />
        <OpenSurveys />

        <button
          onClick={() => setTellOpen(true)}
          className="min-h-11 px-1 text-left text-xs text-ink-burgundy underline underline-offset-[3px]"
        >
          Tell a leader · 24-hour Champion read
        </button>
      </div>
      <TellALeaderSheet open={tellOpen} onClose={() => setTellOpen(false)} />
    </div>
  )
}

/* ── Score card (real trend, suppression-aware) ────────────────────────── */

function PulseScoreCard({ summary }: { summary: AnalyticsSummary }) {
  const points = summary.trend
  const shown = points.filter((p) => p.value !== null)
  const todayValue = summary.todayScore
  const previous = shown.filter((p) => p.date !== summary.today).at(-1)?.value ?? null
  const delta = todayValue !== null && previous !== null ? todayValue - previous : null
  const state = delta === null ? 'GATHERING' : delta >= 2 ? 'LIFTING' : delta <= -2 ? 'NEEDS ATTENTION' : 'STEADY'
  const maxBar = 30

  return (
    <GreenCard className="relative overflow-hidden">
      <span aria-hidden="true" className="absolute -top-5 -right-5 h-24 w-24 rounded-full bg-bloom-gold-bright/12" />
      <MicroLabel className="text-bloom-gold-soft">Pastoral Pulse · {state}</MicroLabel>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-[40px] font-extrabold text-bloom-gold-bright">{todayValue ?? '—'}</span>
        <span className="text-xs text-on-dark-soft">
          / 100 {delta !== null ? `· ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} vs previous` : `· appears at ${summary.kAnon} voices`}
        </span>
      </div>
      <div
        className="mt-2 flex h-[30px] items-end gap-1"
        role="img"
        aria-label={
          shown.length
            ? `Pulse by day: ${shown.map((p) => `${p.date} ${p.value} of 100`).join(', ')}.`
            : 'No days have reached the anonymity threshold yet.'
        }
      >
        {points.slice(-7).map((p, i, arr) => (
          <span
            key={p.date}
            className={`flex-1 rounded-[3px] ${p.value === null ? 'bg-on-dark/10' : i === arr.length - 1 ? 'bg-bloom-gold-bright' : 'bg-on-dark/30'}`}
            style={{ height: `${p.value === null ? 4 : Math.round((p.value / 100) * maxBar)}px` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-on-dark-soft">
        {summary.todayVoices} voice{summary.todayVoices === 1 ? '' : 's'} today · updated{' '}
        {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </p>
    </GreenCard>
  )
}

/* ── Teacher ───────────────────────────────────────────────────────────── */

function MicroMoveCard() {
  const store = useAppStore()
  const move = store.today?.microMove
  const { data: followupData, reload: reloadFollowup } = useApi(() => Api.microMoveFollowup(), [])
  const followup = followupData?.followup ?? null

  return (
    <GoldCard>
      <MicroLabel className="text-ink-gold">POUI micro-move</MicroLabel>
      {followup ? (
        <div className="mt-1.5 rounded-[10px] border border-bloom-gold-line bg-white p-3">
          <p className="text-xs leading-relaxed text-ink-soft">
            Yesterday you tried: <i>"{followup.text}"</i> — did it help?
          </p>
          <div className="mt-2 flex gap-1.5">
            {(['Yes', 'A little', 'No'] as const).map((h) => (
              <button
                key={h}
                onClick={async () => {
                  await Api.answerFollowup(followup.date, h)
                  reloadFollowup()
                }}
                className="min-h-11 rounded-full border-[1.5px] border-bloom-line-strong px-3.5 py-1.5 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {move ? (
        <>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A4636] italic">"{move.text}"</p>
          <p className="mt-1.5 text-[11px] text-ink-meta">{move.reason}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => store.microMoveAction({ tried: !move.tried })}
              aria-pressed={move.tried}
              className={`min-h-11 rounded-[10px] px-3.5 py-2 text-[11.5px] font-bold transition-colors duration-150 ${
                move.tried ? 'bg-bloom-green text-on-dark' : 'bg-bloom-gold-chip text-ink-gold hover:bg-bloom-gold-line'
              }`}
            >
              {move.tried ? 'Tried ✓' : 'Mark as tried'}
            </button>
            <button
              onClick={() => store.microMoveAction({ saved: !move.saved })}
              aria-pressed={move.saved}
              className="min-h-11 rounded-[10px] border border-bloom-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
            >
              {move.saved ? 'Saved ✓' : 'Save'}
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
            Generated from your pulse (curated bank while offline). POUI GPT opens outside Bloom, in ChatGPT.
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          Complete today's pulse and your micro-move for tomorrow appears here.
        </p>
      )}
    </GoldCard>
  )
}

/** Teacher's own safeguarding reports with Champion read receipts (FIX 1). */
function MyReportsCard() {
  const { data } = useApi(() => Api.myReports(), [])
  const reports = data?.reports ?? []
  if (reports.length === 0) return null
  return (
    <DarkCard>
      <MicroLabel className="text-mark-selfemptying-soft">Your reports to the Champion</MicroLabel>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {reports.slice(0, 3).map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-[12.5px]">
            <span className="text-on-dark-soft">
              {new Date(r.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })} ·{' '}
              {r.triggerType === 'safeguarding' ? 'Tell a leader' : 'Pulse note'}
            </span>
            {r.readAt ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#8FE3B0]">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Read by your Champion
              </span>
            ) : (
              <span className="ml-auto text-[11px] font-bold text-on-dark-meta">Waiting · read within 24h</span>
            )}
          </li>
        ))}
      </ul>
    </DarkCard>
  )
}

function TodayTeacher() {
  const store = useAppStore()
  const [tellOpen, setTellOpen] = useState(false)
  const { data: summary, error, loading, reload } = useApi(() => Api.analytics('7d'), [])
  const { today, todayError } = store

  if (todayError) return <ErrorState body="Today could not be loaded. Check your connection and try again." onRetry={store.refreshToday} />
  if (!today || loading) return <ScreenSkeleton />
  if (error || !summary) return <ErrorState body="School insights could not be loaded." onRetry={reload} />

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Today's Insights" sub={`Pastoral Pulse · ${summary.todayVoices} voices today`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <div className="space-y-3">
          <PulseScoreCard summary={summary} />
          {!today.run ? (
            <GoldCard>
              <p className="text-[13px] leading-relaxed text-[#4A4636]">
                Your pulse is not in yet — it takes two minutes and joins today's collated voice.
              </p>
              <Link to="/pulse" className="mt-2 inline-block min-h-11 rounded-[10px] bg-bloom-green px-3.5 py-2.5 text-[11.5px] font-bold text-on-dark">
                Start the Daily Pulse →
              </Link>
            </GoldCard>
          ) : null}
          <MyReportsCard />
        </div>
        <div className="space-y-3">
          <MicroMoveCard />
          <BridgeReminder />
          <SurveyBuilderPromoCard />
          <OpenSurveys />
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

function PerceptionGapCard({ summary }: { summary: AnalyticsSummary }) {
  const gap = summary.perceptionGap
  return (
    <DarkCard>
      <MicroLabel className="text-bloom-gold-bright">Perception gap · Safety</MicroLabel>
      <div className="mt-2.5 flex gap-3.5">
        <div className="flex-1">
          <div className="font-display text-[26px] font-extrabold text-bloom-gold-bright">
            {gap.staff.suppressed ? '—' : `${gap.staff.pct}%`}
          </div>
          <div className="text-[10.5px] text-on-dark-meta">
            {gap.staff.suppressed ? `staff view appears at 10 voices (${gap.staff.voices} so far)` : 'staff believe pupils felt safe'}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-display text-[26px] font-extrabold text-[#F0967F]">
            {gap.pupil.suppressed ? '—' : `${gap.pupil.pct}%`}
          </div>
          <div className="text-[10.5px] text-on-dark-meta">
            {gap.pupil.suppressed ? `pupil view appears at ${summary.kAnon} voices (${gap.pupil.voices} so far)` : 'pupils say they felt safe'}
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-on-dark-soft">
        Computed from the last fortnight's pulses. Neither view is treated as automatically correct.
      </p>
    </DarkCard>
  )
}

function LogActionCard({ onLogged }: { onLogged: () => void }) {
  const [openForm, setOpenForm] = useState(false)
  const [signal, setSignal] = useState('')
  const [action, setAction] = useState('')
  const [saved, setSaved] = useState(false)
  return (
    <GoldCard>
      <MicroLabel className="text-ink-gold">You said → We did</MicroLabel>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
        Attach a small change to a signal — pupils see it on their Today screen, plainly and factually.
      </p>
      {saved ? (
        <p role="status" className="mt-2 rounded-[9px] bg-[#EAF4EC] px-3 py-2 text-xs font-semibold text-[#2F5E3F]">
          ✓ Logged. It now cycles on pupil Today screens.
        </p>
      ) : null}
      {openForm ? (
        <form
          className="mt-2 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!signal.trim() || !action.trim()) return
            await Api.logAction(signal, action)
            setSignal('')
            setAction('')
            setOpenForm(false)
            setSaved(true)
            onLogged()
          }}
        >
          <label className="block">
            <span className="micro-label text-ink-meta">What pupils told us</span>
            <input value={signal} onChange={(e) => setSignal(e.target.value)} maxLength={200} className="mt-1 w-full rounded-[9px] border border-bloom-line-strong bg-white px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green" />
          </label>
          <label className="block">
            <span className="micro-label text-ink-meta">What we changed</span>
            <input value={action} onChange={(e) => setAction(e.target.value)} maxLength={300} className="mt-1 w-full rounded-[9px] border border-bloom-line-strong bg-white px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="min-h-11 rounded-[10px] bg-bloom-green px-3.5 py-2 text-[11.5px] font-bold text-on-dark">
              Log it
            </button>
            <button type="button" onClick={() => setOpenForm(false)} className="min-h-11 px-2 text-[11.5px] font-bold text-ink-meta underline underline-offset-2">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setOpenForm(true)
            setSaved(false)
          }}
          className="mt-2 min-h-11 rounded-[10px] border border-bloom-line-strong bg-white px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
        >
          Log an action…
        </button>
      )}
    </GoldCard>
  )
}

function ChampionSummaryCard() {
  const { data } = useApi(() => Api.championOverview(), [])
  const open = data?.alerts.filter((a) => a.status === 'open').length ?? 0
  const wl = data?.watchlist.length ?? 0
  return (
    <Link to="/champion" className="block rounded-card bg-bloom-charcoal p-4 text-on-dark transition-transform duration-150 hover:scale-[1.01]">
      <MicroLabel className="text-mark-selfemptying-soft">Champion workspace</MicroLabel>
      <p className="mt-1.5 text-[13px] leading-relaxed">
        <b>
          {open} alert{open === 1 ? '' : 's'}
        </b>{' '}
        awaiting your read · <b>{wl}</b> on the watchlist. Every voice read within 24 hours.
      </p>
      <span className="mt-2 inline-block text-[11.5px] font-extrabold text-bloom-gold-bright">Open workspace →</span>
    </Link>
  )
}

function TodayLeader() {
  const store = useAppStore()
  const me = useMe()
  const navigate = useNavigate()
  const { data: summary, error, loading, reload } = useApi(() => Api.analytics('7d'), [])
  const { data: actionsData, reload: reloadActions } = useApi(() => Api.actions(), [])

  if (loading || !store.today) return <ScreenSkeleton />
  if (error || !summary) return <ErrorState body="Leadership insights could not be loaded." onRetry={reload} />

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="Leadership view" sub={`${me.school.name} · ${summary.todayVoices} voices today`} />
      <div className="space-y-3 px-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 md:px-0">
        <div className="space-y-3">
          <PerceptionGapCard summary={summary} />
          <Card>
            <h2 className="text-sm font-semibold">Where the week needs attention</h2>
            <p className="mt-0.5 text-[11px] text-ink-meta">Weakest domains from real pulses · suppressed below {summary.kAnon} voices</p>
            {summary.themes.length === 0 ? (
              <p className="mt-2.5 text-[12.5px] text-ink-meta">Signals are still gathering this week.</p>
            ) : (
              <div className="mt-2.5 flex flex-col gap-2">
                {summary.themes.map((t) => (
                  <div key={t.label} className="grid grid-cols-[1fr_90px_38px] items-center gap-2">
                    <span className="text-[12.5px] font-semibold">{t.label}</span>
                    <div className="h-[9px] overflow-hidden rounded-full bg-bloom-cream-dim" role="img" aria-label={`${t.label}: ${t.value} out of 100 from ${t.voices} voices`}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${t.value}%`, backgroundColor: t.value < 60 ? '#D9634E' : t.value < 68 ? '#C8A951' : '#5BAA70' }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-ink-meta">{t.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {me.isChampion ? <ChampionSummaryCard /> : null}
        </div>
        <div className="space-y-3">
          <BridgeReminder />
          <LogActionCard onLogged={reloadActions} />
          {actionsData && actionsData.actions.length > 0 ? (
            <Card>
              <MicroLabel className="text-ink-meta">Live on pupil screens</MicroLabel>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {actionsData.actions.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-xs leading-relaxed text-ink-soft">
                    <b>{a.signal}</b> → {a.action}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <GoldCard>
            <MicroLabel className="text-ink-gold">This week's Leader Pulse</MicroLabel>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
              {store.today.run ? 'Logged — your answers sit beside pupil voice in Friday\'s Bridge.' : 'Five decision questions, once a week, compared with pupil voice.'}
            </p>
            {!store.today.run ? (
              <button
                onClick={() => navigate('/pulse')}
                className="mt-2.5 min-h-11 rounded-[10px] bg-bloom-green px-3.5 py-2 text-[11.5px] font-bold text-on-dark transition-colors hover:bg-bloom-green-deep"
              >
                Answer this week's Leader Pulse →
              </button>
            ) : (
              <StatusBadge tone="live">Logged ✓</StatusBadge>
            )}
          </GoldCard>
          <SurveyBuilderPromoCard />
          <Link to="/bridge" className="block min-h-11 px-1 text-xs font-bold text-bloom-green underline underline-offset-[3px]">
            Read this week's Bridge digest →
          </Link>
        </div>
      </div>
    </div>
  )
}
