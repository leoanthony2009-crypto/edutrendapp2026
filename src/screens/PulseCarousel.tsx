import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { BloomLogo } from '../components/BloomLogo'
import { Button, ProgressBar, ThemeBadge } from '../components/primitives'
import { EmptyState, ErrorState, PageSkeleton } from '../components/states'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../SessionContext'
import { getCurrentSubmission, getTodayQuestions, submitPulse } from '../services/pulses'
import { voicesToday } from '../services/trends'
import type { PulseQuestion, Role } from '../types/pulse'
import type { SynodalMark } from '../types/synodal'

const TITLES: Record<Role, string> = {
  student: 'Your Voice Today',
  teacher: 'Daily Pulse',
  leader: 'Leader Pulse · weekly',
}

const FOOTNOTES: Record<Role, string> = {
  student: 'Anonymous · "prefer not to say" is always okay',
  teacher: 'Two-minute contract · anonymous by design',
  leader: 'Compared with pupil voice, never assumed correct',
}

type Phase = 'running' | 'submitting' | 'done'

export function PulseCarousel() {
  const { session } = useSession()
  const role = session.role
  const navigate = useNavigate()

  const { data, loading, error, reload } = useAsync(() => {
    const questions = getTodayQuestions(role)
    const existing = getCurrentSubmission(role)
    return { questions, existing }
  }, [role])

  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [phase, setPhase] = useState<Phase>('running')
  const [championAlerted, setChampionAlerted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)
  const alreadySubmitted = data?.existing != null

  // Re-opening after submission: prefill saved answers so they can be reviewed/changed
  // (derived during render, once per loaded submission).
  if (data?.existing && hydratedFor !== data.existing.id) {
    setHydratedFor(data.existing.id)
    const prev: Record<string, string | number> = {}
    for (const r of data.existing.responses) prev[r.questionId] = r.value
    setAnswers(prev)
    setPhase('done')
    setQi(data.questions.length)
  }

  const questions = useMemo(() => data?.questions ?? [], [data])

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  if (questions.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Today's voice is still gathering"
          body="There are no questions in this carousel yet. Add one to begin."
          action={
            role !== 'student' ? (
              <Button onClick={() => navigate('/pulse/manage')}>Add questions</Button>
            ) : undefined
          }
        />
      </Screen>
    )
  }

  const q = questions[Math.min(qi, questions.length - 1)]
  const isChoice = Array.isArray(q.options)
  const answer = answers[q.id]
  const canNext = isChoice ? typeof answer === 'number' : true
  const isLast = qi === questions.length - 1

  const finish = async () => {
    setPhase('submitting')
    setSubmitError(null)
    try {
      const result = await submitPulse(role, questions, answers)
      setChampionAlerted(result.championAlerted)
      setPhase('done')
      setQi(questions.length)
    } catch {
      setSubmitError('Your answers could not be saved just now. They are still here — try again.')
      setPhase('running')
    }
  }

  if (phase === 'done') {
    return (
      <Screen>
        <DoneState
          role={role}
          championAlerted={championAlerted}
          resubmitting={alreadySubmitted}
          onReview={() => {
            setPhase('running')
            setQi(0)
          }}
          onToday={() => navigate('/today')}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex items-center justify-between px-4 pt-4 md:px-0">
        <h1 className="font-display text-[15px] font-bold text-green">{TITLES[role]}</h1>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gold-ink" aria-label={`Question ${qi + 1} of ${questions.length}`}>
            {qi + 1} / {questions.length}
          </span>
          {role !== 'student' && (
            <Link
              to="/pulse/manage"
              className="min-h-11 content-center px-1 text-[11px] font-bold text-green underline underline-offset-2"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 md:px-0">
        <ProgressBar
          value={qi + (canNext && answer !== undefined ? 1 : 0.25)}
          max={questions.length}
          label={`Pulse progress: question ${qi + 1} of ${questions.length}`}
          className="!h-[5px]"
          trackClass="bg-sand"
        />
      </div>

      <div className="px-5 pt-6 md:px-0" aria-live="polite">
        <ThemeBadge
          theme={q.theme}
          mark={role === 'teacher' ? (q.theme as SynodalMark) : undefined}
        />
        <h2 className="font-display mt-3 text-[23px] font-bold leading-[1.28] tracking-[-0.01em]">{q.text}</h2>
      </div>

      {isChoice ? (
        <fieldset className="flex flex-col gap-2 border-0 px-4 pt-5 md:px-0" aria-label="Answers">
          {q.options!.map((label, i) => {
            const selected = answer === i
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                className={`flex min-h-[50px] items-center gap-3 rounded-input border-[1.5px] px-4 py-3 text-left transition-colors duration-150 ${
                  selected
                    ? 'border-green bg-green text-ondark'
                    : 'border-line-strong bg-white text-ink hover:border-green'
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                {selected && <Check aria-hidden="true" className="ml-auto h-4 w-4" strokeWidth={3} />}
              </button>
            )
          })}
        </fieldset>
      ) : (
        <FreeTextAnswer
          key={q.id}
          role={role}
          question={q}
          value={typeof answer === 'string' ? answer : ''}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        />
      )}

      {submitError && (
        <p role="alert" className="px-5 pt-3 text-xs font-semibold text-concern-text md:px-0">
          {submitError}
        </p>
      )}

      <div className="flex gap-2 px-4 pt-5 md:px-0">
        <Button variant="outline" onClick={() => setQi((i) => Math.max(0, i - 1))} disabled={qi === 0}>
          Back
        </Button>
        <Button
          variant="gold"
          className="flex-1"
          disabled={!canNext || phase === 'submitting'}
          onClick={() => {
            if (!canNext) return
            if (isLast) void finish()
            else setQi((i) => i + 1)
          }}
        >
          {phase === 'submitting' ? 'Saving…' : !canNext ? 'Pick an answer' : isLast ? 'Finish' : 'Next →'}
        </Button>
      </div>
      <p className="pt-3 text-center text-[11px] text-meta">{FOOTNOTES[role]}</p>
    </Screen>
  )
}

/** Free-text answers use a real textarea with a character guide (DESIGN_REVIEW P1-4). */
function FreeTextAnswer({
  role,
  question,
  value,
  onChange,
}: {
  role: Role
  question: PulseQuestion
  value: string
  onChange: (v: string) => void
}) {
  const max = 280
  return (
    <div className="px-4 pt-5 md:px-0">
      <label>
        <span className="sr-only">Your answer to: {question.text}</span>
        <textarea
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={role === 'student' ? 'Only if you want to — a word or a sentence' : 'Type here — a word or a sentence'}
          rows={4}
          className="min-h-28 w-full resize-y rounded-input border-[1.5px] border-line-strong bg-white p-3.5 text-sm leading-relaxed text-ink outline-none focus:border-green"
        />
      </label>
      <div className="mt-2 flex justify-between gap-3 text-[11px] text-meta">
        <span>
          {role === 'student'
            ? 'Optional. If this signals worry, only your Pastoral Champion reads it.'
            : 'Free text signalling concern is read by your Pastoral Champion within 24 hours.'}
        </span>
        <span aria-label={`${value.length} of ${max} characters used`}>
          {value.length}/{max}
        </span>
      </div>
    </div>
  )
}

function DoneState({
  role,
  championAlerted,
  resubmitting,
  onReview,
  onToday,
}: {
  role: Role
  championAlerted: boolean
  resubmitting: boolean
  onReview: () => void
  onToday: () => void
}) {
  const voices = voicesToday()
  const copy: Record<Role, { title: string; body: string; cta: string }> = {
    student: {
      title: 'Heard. Thank you.',
      body: `Your voice joined ${voices - 1} others today. Adults see patterns, never your name.`,
      cta: "See Today's Insights",
    },
    teacher: {
      title: 'Thank you',
      body: `Your voice joined ${voices} voices today. It is now collated into Today's Insights and Trends.`,
      cta: "See Today's Insights",
    },
    leader: {
      title: 'Logged for the Bridge',
      body: "Your answers will sit beside pupil voice in Friday's Bridge digest — comparing perception with experience.",
      cta: 'Back to leadership view',
    },
  }
  return (
    <div className="flex flex-col items-center gap-3 px-8 pt-14 text-center">
      <BloomLogo size={76} animate />
      <h1 className="font-display text-[26px] font-extrabold text-green">{copy[role].title}</h1>
      <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">{copy[role].body}</p>
      {championAlerted && (
        <p className="max-w-sm text-xs leading-relaxed text-gold-ink" role="status">
          Something you wrote will be read by your Pastoral Champion within 24 hours.
        </p>
      )}
      <Button className="mt-2" onClick={onToday}>
        {copy[role].cta}
      </Button>
      {/* Pulses run once per day — reviewing answers replaces the prototype's demo-only
          "Run again" (DESIGN_REVIEW P3-16). */}
      <button
        type="button"
        onClick={onReview}
        className="min-h-11 px-2 text-xs text-gold-ink underline underline-offset-2 hover:text-ink"
      >
        {resubmitting ? 'See or change my answers' : 'Review my answers'}
      </button>
    </div>
  )
}
