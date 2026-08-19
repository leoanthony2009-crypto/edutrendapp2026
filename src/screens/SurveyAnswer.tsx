import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft } from 'lucide-react'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useRovingRadio } from '../hooks/useRovingRadio'
import { BloomMarkAnimated } from '../components/BloomLogo'
import { ErrorState, PageHeader, PrimaryButton, ProgressBar, ScreenSkeleton } from '../components/ui'

function Choice({ options, selected, onSelect, label }: { options: string[]; selected: number; onSelect: (i: number) => void; label: string }) {
  const { itemProps } = useRovingRadio(options.length, selected, onSelect)
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2 pt-4">
      {options.map((option, i) => (
        <button
          key={option}
          {...itemProps(i)}
          className={`flex min-h-[50px] items-center gap-3 rounded-row border-[1.5px] px-4 py-3 text-left transition-colors duration-150 ${
            selected === i ? 'border-bloom-green bg-bloom-green text-on-dark' : 'border-bloom-line-strong bg-white text-ink hover:border-bloom-green'
          }`}
        >
          <span className="text-sm font-semibold">{option}</span>
          {selected === i ? <Check aria-hidden="true" className="ml-auto h-4 w-4" strokeWidth={3} /> : null}
        </button>
      ))}
    </div>
  )
}

/** One-question-per-screen survey answering — same contract as the pulse. */
export function SurveyAnswer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi(() => Api.surveys(), [])
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState body="This survey could not be loaded." onRetry={reload} />

  const survey = data.open.find((s) => s.id === id)
  if (!survey || survey.answered) {
    return (
      <ErrorState
        title={survey?.answered ? 'Already answered' : 'Survey unavailable'}
        body={survey?.answered ? 'You have already answered this survey — thank you.' : 'This survey is closed or not meant for your group.'}
      />
    )
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 px-7 pt-14 text-center">
        <BloomMarkAnimated size={76} />
        <h1 className="font-display text-[26px] font-extrabold text-bloom-green">Heard. Thank you.</h1>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#6B6F5F]">
          Your answers joined this survey's voices. Results only ever appear as patterns of 20 voices or more.
        </p>
        <PrimaryButton className="mt-2" onClick={() => navigate('/today')}>
          Back to Today
        </PrimaryButton>
      </div>
    )
  }

  const q = survey.questions[qi]
  const answer = answers[q.id]
  const isChoice = Array.isArray(q.options)
  const isLast = qi === survey.questions.length - 1
  const canNext = isChoice ? typeof answer === 'number' : true

  const next = async () => {
    if (!canNext || busy) return
    if (!isLast) {
      setQi(qi + 1)
      return
    }
    setBusy(true)
    setSubmitError(null)
    try {
      await Api.respondSurvey(survey.id, answers)
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error && err.message === 'already_answered' ? 'You have already answered this survey.' : 'Your answers could not be sent — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 md:px-0">
      <PageHeader
        title={survey.title}
        sub={`${survey.questions.length} questions · anonymous above 20 voices`}
        back={
          <Link to="/today" aria-label="Back to Today" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />
      <ProgressBar
        value={qi + (canNext && answer !== undefined && answer !== '' ? 1 : 0.25)}
        max={survey.questions.length}
        label={`Survey progress: question ${qi + 1} of ${survey.questions.length}`}
        className="mt-3 h-[5px]"
        trackClass="bg-bloom-sand"
      />
      <p aria-live="polite" className="mt-2 text-[11px] font-bold text-ink-gold">
        Question {qi + 1} of {survey.questions.length}
      </p>
      <h2 className="mt-3 font-display text-[23px] leading-[1.28] font-bold tracking-tight text-pretty">{q.text}</h2>

      {isChoice ? (
        <Choice key={q.id} label={q.text} options={q.options!} selected={typeof answer === 'number' ? answer : -1} onSelect={(i) => setAnswers((p) => ({ ...p, [q.id]: i }))} />
      ) : (
        <div className="pt-4">
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            aria-label={q.text}
            rows={4}
            maxLength={500}
            placeholder="Only if you want to — a word or a sentence"
            className="min-h-28 w-full resize-y rounded-row border-[1.5px] border-bloom-line-strong bg-white px-4 py-3.5 text-sm outline-none focus:border-bloom-green"
          />
        </div>
      )}

      <div className="flex gap-2 pt-5">
        <button
          onClick={() => (qi === 0 ? navigate('/today') : setQi(qi - 1))}
          className="min-h-11 rounded-row border-[1.5px] border-bloom-line-strong px-4 py-3 text-[13px] font-bold text-ink-meta transition-colors hover:border-bloom-green hover:text-bloom-green"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!canNext || busy}
          className="min-h-11 flex-1 rounded-row bg-bloom-gold px-4 py-3 text-sm font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold-bright disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta"
        >
          {busy ? 'Sending…' : canNext ? (isLast ? 'Finish' : 'Next →') : 'Pick an answer'}
        </button>
      </div>
      {submitError ? (
        <p role="alert" className="mt-3 rounded-input bg-bloom-gold-tint px-3.5 py-2.5 text-xs font-semibold text-ink-gold">
          {submitError}
        </p>
      ) : null}
    </div>
  )
}
