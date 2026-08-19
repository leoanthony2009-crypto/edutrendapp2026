import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Volume2 } from 'lucide-react'
import { useRovingRadio } from '../hooks/useRovingRadio'
import { useAppStore, useMe } from '../store/AppStore'
import { Api } from '../services/api'
import { BloomMarkAnimated } from '../components/BloomLogo'
import { MarkBadge, PrimaryButton, ProgressBar, ScreenSkeleton, ThemeBadge, EmptyState, ErrorState, GhostButton } from '../components/ui'
import { OneChildEntryForm } from '../components/OneChildEntryForm'

const TITLES = { student: 'Your Voice Today', teacher: 'Daily Pulse', leader: 'Leader Pulse · weekly' }
const FOOTNOTES = {
  student: 'Anonymous · "prefer not to say" is always okay',
  teacher: 'Two-minute contract · anonymous by design',
  leader: 'Compared with pupil voice, never assumed correct',
}

function ChoiceOptions({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: string[]
  selected: number
  onSelect: (index: number) => void
}) {
  const { itemProps } = useRovingRadio(options.length, selected, onSelect)
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2 px-4 pt-5 md:px-0">
      {options.map((option, i) => {
        const isSelected = selected === i
        return (
          <button
            key={option}
            {...itemProps(i)}
            className={`flex min-h-[50px] items-center gap-3 rounded-row border-[1.5px] px-4 py-3 text-left transition-colors duration-150 ${
              isSelected
                ? 'border-bloom-green bg-bloom-green text-on-dark'
                : 'border-bloom-line-strong bg-white text-ink hover:border-bloom-green'
            }`}
          >
            <span className="text-sm font-semibold">{option}</span>
            {isSelected ? <Check aria-hidden="true" className="ml-auto h-4 w-4" strokeWidth={3} /> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Read-aloud affordance (spec § 9 voice mode) — browser speech, no network. */
function ReadAloudButton({ text }: { text: string }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return (
    <button
      type="button"
      aria-label="Read this question aloud"
      onClick={() => {
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
      }}
      className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-bloom-green"
    >
      <Volume2 aria-hidden="true" className="h-4.5 w-4.5" />
    </button>
  )
}

export function PulseCarousel() {
  const store = useAppStore()
  const me = useMe()
  const navigate = useNavigate()
  const [qi, setQi] = useState(0)
  const [editing, setEditing] = useState(false)
  const [finished, setFinished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [oneChildDone, setOneChildDone] = useState(false)

  const { today, todayError } = store
  if (todayError) return <ErrorState body="Today's questions could not be loaded. Check your connection and try again." onRetry={store.refreshToday} />
  if (!today) return <ScreenSkeleton />

  const questions = today.questions
  const role = me.role

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

  // Completed-until-midnight state (COUNCIL_FIXES FIX 5): after submission the
  // Pulse tab shows the done state; "Edit today's answers" re-opens the run.
  if (today.run && !editing && !finished) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 px-7 pt-10 text-center md:pt-16">
        <BloomMarkAnimated size={76} />
        <h1 className="font-display text-[26px] font-extrabold text-bloom-green">Today's pulse is in</h1>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#6B6F5F]">
          Submitted at {new Date(today.run.submittedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. A new
          pulse opens tomorrow — until midnight you can change today's answers.
        </p>
        <div className="mt-1 flex gap-2">
          <PrimaryButton onClick={() => navigate('/today')}>See Today's Insights</PrimaryButton>
          <GhostButton
            onClick={() => {
              for (const [qid, v] of Object.entries(today.run!.answers)) store.setDraft(qid, v)
              setEditing(true)
              setQi(0)
            }}
          >
            Edit today's answers
          </GhostButton>
        </div>
      </div>
    )
  }

  if (finished) {
    const copy = {
      student: {
        title: 'Heard. Thank you.',
        body: 'Your voice joined today\'s pulses. Adults see patterns, never your name.',
        cta: "See Today's Insights",
      },
      teacher: {
        title: 'Thank you',
        body: "Your voice is now collated into Today's Insights and Trends.",
        cta: "See Today's Insights",
      },
      leader: {
        title: 'Logged for the Bridge',
        body: "Your answers will sit beside pupil voice in Friday's Bridge digest — comparing perception with experience.",
        cta: 'Back to leadership view',
      },
    }[role]

    return (
      <div role="status" className="flex flex-col items-center gap-3 px-7 pt-10 text-center md:pt-16">
        <BloomMarkAnimated size={76} />
        <h1 className="font-display text-[26px] font-extrabold text-bloom-green">{copy.title}</h1>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#6B6F5F]">{copy.body}</p>
        {role === 'teacher' && !oneChildDone ? (
          <div className="mt-2 w-full max-w-md">
            <OneChildEntryForm
              onSubmit={async (entry) => {
                await Api.oneChild({ yearGroup: entry.yearGroup, handle: entry.handle, notedFor: entry.notedFor })
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

  const next = async () => {
    if (!canNext || submitting) return
    if (!isLast) {
      setQi(qi + 1)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await store.submitRun()
      store.clearDrafts()
      setEditing(false)
      setFinished(true)
    } catch {
      setSubmitError('Your answers could not be sent. They are kept on this screen — try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between px-4 pt-4 md:px-0">
        <h1 className="font-display text-[15px] font-bold text-bloom-green">{TITLES[role]}</h1>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-[11px] font-bold text-ink-gold">
            <span aria-hidden="true">
              {qi + 1} / {questions.length}
            </span>
            <span className="sr-only">
              Question {qi + 1} of {questions.length}
            </span>
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
          <span className="ml-auto">
            <ReadAloudButton text={`${q.text}. ${q.options ? `Options: ${q.options.join(', ')}` : 'Open answer.'}`} />
          </span>
        </div>
        <h2 className="mt-3 font-display text-[23px] leading-[1.28] font-bold tracking-tight text-pretty">{q.text}</h2>
      </div>

      {isChoice ? (
        <ChoiceOptions
          key={q.id}
          label={q.text}
          options={q.options!}
          selected={typeof answer === 'number' ? answer : -1}
          onSelect={(i) => store.setDraft(q.id, i)}
        />
      ) : (
        <div className="px-4 pt-5 md:px-0">
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
          disabled={!canNext || submitting}
          className="min-h-11 flex-1 rounded-row bg-bloom-gold px-4 py-3 text-sm font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold-bright disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta"
        >
          {submitting ? 'Sending…' : canNext ? (isLast ? 'Finish' : 'Next →') : 'Pick an answer'}
        </button>
      </div>
      {submitError ? (
        <p role="alert" className="mx-4 mt-3 rounded-input bg-bloom-gold-tint px-3.5 py-2.5 text-xs font-semibold text-ink-gold md:mx-0">
          {submitError}
        </p>
      ) : null}
      <p className="pt-3 pb-4 text-center text-[11px] text-ink-meta">{FOOTNOTES[role]}</p>
    </div>
  )
}
