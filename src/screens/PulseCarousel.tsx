import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { BloomMarkAnimated } from '../components/BloomLogo'
import { MarkBadge, PrimaryButton, ProgressBar, ScreenSkeleton, ThemeBadge, EmptyState } from '../components/ui'
import { OneChildEntryForm } from '../components/OneChildEntryForm'
import { useLoaded } from '../hooks/useLoaded'
import { PREFER_NOT_TO_SAY } from '../data/questionBanks'

const TITLES = { student: 'Your Voice Today', teacher: 'Daily Pulse', leader: 'Leader Pulse · weekly' }
const FOOTNOTES = {
  student: 'Anonymous · "prefer not to say" is always okay',
  teacher: 'Two-minute contract · anonymous by design',
  leader: 'Compared with pupil voice, never assumed correct',
}

export function PulseCarousel() {
  const store = useAppStore()
  const navigate = useNavigate()
  const loaded = useLoaded()
  const role = store.account!.role
  const questions = store.todaysQuestions(role)
  const [qi, setQi] = useState(0)
  const [finished, setFinished] = useState(false)
  const [oneChildDone, setOneChildDone] = useState(false)

  if (!loaded) return <ScreenSkeleton />

  if (questions.length === 0) {
    return (
      <EmptyState
        title="Today's voice is still gathering"
        body="There are no questions in this carousel yet. Add one to begin."
        action={
          role !== 'student' ? (
            <Link to="/manage" className="inline-block rounded-input bg-bloom-green px-5 py-3 text-[13px] font-extrabold text-on-dark">
              Add questions
            </Link>
          ) : undefined
        }
      />
    )
  }

  if (finished) {
    const respCount = 164
    const copy = {
      student: {
        title: 'Heard. Thank you.',
        body: `Your voice joined ${respCount} others today. Adults see patterns, never your name.`,
        cta: "See Today's Insights",
      },
      teacher: {
        title: 'Thank you',
        body: `Your voice joined ${respCount + 1} voices today. It is now collated into Today's Insights and Trends.`,
        cta: "See Today's Insights",
      },
      leader: {
        title: 'Logged for the Bridge',
        body: "Your answers will sit beside pupil voice in Friday's Bridge digest — comparing perception with experience.",
        cta: 'Back to leadership view',
      },
    }[role]

    return (
      <div className="flex flex-col items-center gap-3 px-7 pt-10 text-center md:pt-16">
        <BloomMarkAnimated size={76} />
        <h1 className="font-display text-[26px] font-extrabold text-bloom-green">{copy.title}</h1>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#6B6F5F]">{copy.body}</p>
        {role === 'teacher' && !oneChildDone ? (
          <div className="mt-2 w-full max-w-md">
            <OneChildEntryForm
              onSubmit={(entry) => {
                store.submitOneChild(entry)
                setOneChildDone(true)
              }}
              onSkip={() => setOneChildDone(true)}
            />
          </div>
        ) : (
          <PrimaryButton className="mt-2" onClick={() => navigate('/today')}>
            {copy.cta}
          </PrimaryButton>
        )}
      </div>
    )
  }

  const q = questions[Math.min(qi, questions.length - 1)]
  const answer = store.drafts[q.id]
  const isChoice = Array.isArray(q.options)
  const isLast = qi === questions.length - 1
  const canNext = isChoice ? typeof answer === 'number' : true

  const next = () => {
    if (!canNext) return
    if (isLast) {
      store.submitRun(role)
      setFinished(true)
    } else {
      setQi(qi + 1)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between px-4 pt-4 md:px-0">
        <h1 className="font-display text-[15px] font-bold text-bloom-green">{TITLES[role]}</h1>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-ink-gold" aria-label={`Question ${qi + 1} of ${questions.length}`}>
            {qi + 1} / {questions.length}
          </span>
          {role !== 'student' ? (
            <Link to="/manage" className="text-[11px] font-bold text-bloom-green underline underline-offset-2">
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <ProgressBar
        value={qi + (canNext && answer !== undefined && answer !== '' ? 1 : 0.25)}
        max={questions.length}
        label={`Pulse progress: question ${qi + 1} of ${questions.length}`}
        className="mx-4 mt-3 h-[5px] md:mx-0"
        trackClass="bg-bloom-sand"
      />

      <div className="px-5 pt-6 md:px-0">
        <div className="flex items-center gap-2">
          <ThemeBadge theme={q.theme} />
          {role !== 'student' ? <MarkBadge mark={q.mark} /> : null}
          {q.weekly ? <span className="text-[10px] font-bold text-ink-meta uppercase">Weekly reflection</span> : null}
        </div>
        <h2 className="mt-3 font-display text-[23px] leading-[1.28] font-bold tracking-tight text-pretty">{q.text}</h2>
      </div>

      {isChoice ? (
        <div role="radiogroup" aria-label={q.text} className="flex flex-col gap-2 px-4 pt-5 md:px-0">
          {q.options!.map((label, i) => {
            const selected = answer === i
            return (
              <button
                key={label}
                role="radio"
                aria-checked={selected}
                onClick={() => store.setDraft(q.id, i)}
                className={`flex min-h-[50px] items-center gap-3 rounded-row border-[1.5px] px-4 py-3 text-left transition-colors duration-150 ${
                  selected
                    ? 'border-bloom-green bg-bloom-green text-on-dark'
                    : 'border-bloom-line-strong bg-white text-ink hover:border-bloom-green'
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                {selected ? <Check aria-hidden="true" className="ml-auto h-4 w-4" strokeWidth={3} /> : null}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="px-4 pt-5 md:px-0">
          {/* Free text is a textarea, not a single-line input (DESIGN_REVIEW P1.4) */}
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => store.setDraft(q.id, e.target.value)}
            placeholder={role === 'student' ? 'Only if you want to — a word or a sentence' : 'Type here — a word or a sentence'}
            aria-label={q.text}
            rows={4}
            maxLength={500}
            className="min-h-28 w-full resize-y rounded-row border-[1.5px] border-bloom-line-strong bg-white px-4 py-3.5 text-sm outline-none focus:border-bloom-green"
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-meta">
            <span>
              {role === 'student'
                ? 'Optional. If this signals worry, only your Pastoral Champion reads it.'
                : 'Free text signalling concern is read by your Pastoral Champion within 24 hours.'}
            </span>
            <span aria-label="Character guide">{typeof answer === 'string' ? answer.length : 0}/500</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 px-4 pt-5 md:px-0">
        <button
          onClick={() => (qi === 0 ? navigate('/today') : setQi(qi - 1))}
          className="min-h-11 rounded-row border-[1.5px] border-bloom-line-strong px-4 py-3 text-[13px] font-bold text-ink-meta transition-colors hover:border-bloom-green hover:text-bloom-green"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          className="min-h-11 flex-1 rounded-row bg-bloom-gold px-4 py-3 text-sm font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold-bright disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta"
        >
          {canNext ? (isLast ? 'Finish' : 'Next →') : 'Pick an answer'}
        </button>
      </div>
      <p className="pt-3 pb-4 text-center text-[11px] text-ink-meta">{FOOTNOTES[role]}</p>
      {isChoice && q.options!.includes(PREFER_NOT_TO_SAY) ? (
        <p className="sr-only">"Prefer not to say" is never counted in any score.</p>
      ) : null}
    </div>
  )
}
