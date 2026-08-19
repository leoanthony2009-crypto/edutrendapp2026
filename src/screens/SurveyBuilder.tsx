import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, Flower2, Pause, Play, Trash2, X } from 'lucide-react'
import type { SurveyAudience, SurveyDraftQuestion } from '../types/survey'
import { useAppStore } from '../store/AppStore'
import { MicroLabel, PageHeader, PrimaryButton, ProgressBar, ScreenSkeleton, StatusBadge } from '../components/ui'
import { UNLOCK_TARGET } from '../components/cards'
import { useLoaded } from '../hooks/useLoaded'

const AUDIENCES: SurveyAudience[] = ['My class', 'Whole school', 'Staff']
const DEFAULT_OPTIONS = ['Yes', 'Mostly', 'Not really', 'No']

export function SurveyBuilder() {
  const store = useAppStore()
  const navigate = useNavigate()
  const loaded = useLoaded()
  const role = store.account!.role
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState<SurveyAudience>('My class')
  const [questions, setQuestions] = useState<SurveyDraftQuestion[]>([
    { id: 'bq-1', text: 'New question — tap to edit', options: DEFAULT_OPTIONS },
  ])
  const [nextId, setNextId] = useState(2)
  const [justLaunched, setJustLaunched] = useState(false)

  // Survey creation is a teacher/leader surface; students never see it.
  if (role === 'student') return <Navigate to="/today" replace />
  if (!loaded) return <ScreenSkeleton />

  const completed = store.pulsesCompleted[role] ?? 0
  const unlocked = completed >= UNLOCK_TARGET
  const mine = store.surveys.filter((s) => s.ownerRole === role)
  const canLaunch = title.trim().length > 0 && questions.length > 0

  const header = (
    <PageHeader
      title="Survey Builder"
      sub="Turn your idea into a live pulse"
      back={
        <Link to="/today" aria-label="Back to Today" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Link>
      }
    />
  )

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-xl pb-4">
        {header}
        <div className="mx-4 mt-5 rounded-[20px] border border-bloom-line bg-white px-5 py-6 text-center md:mx-0">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bloom-gold-chip">
            <Flower2 aria-hidden="true" className="h-6 w-6 text-bloom-gold" />
          </div>
          <h2 className="mt-3 font-display text-xl font-extrabold text-bloom-green">Blooms with your voice</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6B6F5F]">
            The Survey Builder unlocks after <b>{UNLOCK_TARGET} completed pulses</b> — so every survey is built by someone who
            answers them too.
          </p>
          <ProgressBar
            value={Math.min(completed, UNLOCK_TARGET)}
            max={UNLOCK_TARGET}
            label={`Unlock progress: ${completed} of ${UNLOCK_TARGET} pulses completed`}
            className="mt-4.5"
          />
          <p className="mt-2 text-xs font-bold text-ink-gold">
            {Math.min(completed, UNLOCK_TARGET)} of {UNLOCK_TARGET} pulses completed · {Math.max(0, UNLOCK_TARGET - completed)}{' '}
            to go
          </p>
          <PrimaryButton className="mt-4 text-[13.5px]" onClick={() => navigate('/pulse')}>
            Complete today's pulse →
          </PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl pb-4">
      {header}
      {justLaunched ? (
        <div role="status" className="mx-4 mt-3.5 rounded-row border border-[#BFDCC8] bg-[#EAF4EC] px-3.5 py-3 text-[12.5px] font-semibold text-[#2F5E3F] md:mx-0">
          ✓ Survey launched. Responses will collate into Trends within 24 hours.
        </div>
      ) : null}

      {mine.length > 0 ? (
        <section aria-label="Your surveys">
          <MicroLabel className="px-4 pt-4 pb-1.5 text-ink-meta md:px-0">Your surveys</MicroLabel>
          <ul className="flex flex-col gap-2 px-4 md:px-0">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 rounded-row border border-bloom-line bg-white px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold">{s.title}</div>
                  <div className="mt-0.5 text-[11px] text-ink-meta">
                    {s.audience} · {s.questions.length} questions · {s.responses} responses
                  </div>
                </div>
                <StatusBadge tone={s.status === 'live' ? 'live' : 'neutral'}>{s.status}</StatusBadge>
                {/* Lifecycle controls (DESIGN_REVIEW P2.10): pause, close/reopen, delete */}
                {s.status !== 'closed' ? (
                  <button
                    onClick={() => store.setSurveyStatus(s.id, s.status === 'live' ? 'paused' : 'live')}
                    aria-label={s.status === 'live' ? `Pause survey ${s.title}` : `Resume survey ${s.title}`}
                    className="grid min-h-9 min-w-9 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-ink"
                  >
                    {s.status === 'live' ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
                  </button>
                ) : null}
                <button
                  onClick={() => (s.status === 'closed' ? store.deleteSurvey(s.id) : store.setSurveyStatus(s.id, 'closed'))}
                  aria-label={s.status === 'closed' ? `Delete survey ${s.title}` : `Close survey ${s.title}`}
                  className="grid min-h-9 min-w-9 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-signal-concern"
                >
                  {s.status === 'closed' ? <Trash2 aria-hidden="true" className="h-4 w-4" /> : <X aria-hidden="true" className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="New survey">
        <MicroLabel className="px-4 pt-4 pb-1.5 text-ink-meta md:px-0">New survey</MicroLabel>
        <div className="mx-4 rounded-card border border-bloom-line bg-white p-4 md:mx-0">
          <label className="sr-only" htmlFor="survey-title">
            Survey title
          </label>
          <input
            id="survey-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setJustLaunched(false)
            }}
            maxLength={80}
            placeholder="Survey title — e.g. Homework load check"
            className="w-full rounded-xl border-[1.5px] border-bloom-line-strong bg-[#FDFBF4] px-3.5 py-3 text-sm font-bold outline-none focus:border-bloom-green"
          />
          <div role="radiogroup" aria-label="Audience" className="mt-2.5 flex flex-wrap gap-1.5">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={audience === a}
                onClick={() => setAudience(a)}
                className={`min-h-9 rounded-full border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold transition-colors duration-150 ${
                  audience === a ? 'border-bloom-green bg-bloom-green text-on-dark' : 'border-bloom-line-strong bg-white text-ink-soft hover:border-bloom-green'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <MicroLabel className="px-4 pt-3.5 pb-1.5 text-ink-meta md:px-0">Questions · {questions.length}</MicroLabel>
        <div className="flex flex-col gap-2 px-4 md:px-0">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setQuestions((prev) => prev.map((it, j) => (j === idx ? { ...it, options: it.options ? null : DEFAULT_OPTIONS } : it)))
                  }
                  className="min-h-8 rounded-full bg-bloom-gold-chip px-2.5 py-1 text-[10px] font-bold text-ink-gold transition-colors hover:bg-bloom-gold-line"
                  aria-label={`Change question type — currently ${q.options ? `choice with ${q.options.length} options` : 'free text'}`}
                >
                  {q.options ? `Choice · ${q.options.length}` : 'Free text'}
                </button>
                <button
                  onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== idx))}
                  aria-label={`Remove question: ${q.text}`}
                  className="ml-auto grid min-h-9 min-w-9 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-signal-concern"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <label className="sr-only" htmlFor={`bq-${q.id}`}>
                Question text
              </label>
              <input
                id={`bq-${q.id}`}
                value={q.text}
                onChange={(e) => setQuestions((prev) => prev.map((it, j) => (j === idx ? { ...it, text: e.target.value } : it)))}
                className="mt-2 w-full rounded-[9px] border border-bloom-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
              />
              <p className="mt-1.5 text-[10.5px] text-ink-meta">{q.options ? q.options.join(' / ') : 'Open response — optional'}</p>
            </div>
          ))}
          <button
            onClick={() => {
              setQuestions((prev) => [...prev, { id: `bq-${nextId}`, text: 'New question — tap to edit', options: DEFAULT_OPTIONS }])
              setNextId((n) => n + 1)
            }}
            className="min-h-12 rounded-row border-[1.5px] border-dashed border-bloom-line-strong py-2.5 text-[13px] font-bold text-ink-meta transition-colors hover:border-bloom-green hover:text-bloom-green"
          >
            + Add question
          </button>
        </div>

        <div className="px-4 pt-3.5 md:px-0">
          <button
            onClick={() => {
              if (!canLaunch) return
              store.launchSurvey(role, title.trim(), audience, questions)
              setTitle('')
              setQuestions([{ id: `bq-${nextId}`, text: 'New question — tap to edit', options: DEFAULT_OPTIONS }])
              setNextId((n) => n + 1)
              setJustLaunched(true)
              window.scrollTo({ top: 0 })
            }}
            disabled={!canLaunch}
            className="min-h-12 w-full rounded-[15px] bg-bloom-gold px-4 py-3.5 text-[14.5px] font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold-bright disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta"
          >
            {canLaunch ? 'Launch survey →' : 'Add a title and a question'}
          </button>
          <p className="px-2.5 pt-2.5 pb-4 text-center text-[11px] leading-relaxed text-ink-meta">
            Anonymity thresholds apply automatically — results appear only above 20 voices.
          </p>
        </div>
      </section>
    </div>
  )
}
