import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Flower2, Pause, Play, RefreshCcw, Sparkles, Trash2, X } from 'lucide-react'
import type { ApiSurvey, GuardrailCheck, SurveyQuestionDraft, YearTier } from '../types/api'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useAppStore, useMe } from '../store/AppStore'
import { useRovingRadio } from '../hooks/useRovingRadio'
import { ErrorState, MicroLabel, PageHeader, PrimaryButton, ProgressBar, ScreenSkeleton, StatusBadge, Toggle } from '../components/ui'
import { UNLOCK_TARGET } from '../components/cards'
import { PermissionDenied } from '../App'

const AUDIENCES = ['My class', 'Whole school', 'Staff'] as const
const DEFAULT_OPTIONS = ['Yes', 'Mostly', 'Not really', 'No']

function AudienceChips({ audience, onChange }: { audience: string; onChange: (a: (typeof AUDIENCES)[number]) => void }) {
  const { itemProps } = useRovingRadio(AUDIENCES.length, AUDIENCES.indexOf(audience as (typeof AUDIENCES)[number]), (i) => onChange(AUDIENCES[i]))
  return (
    <div role="radiogroup" aria-label="Audience" className="mt-2.5 flex flex-wrap gap-1.5">
      {AUDIENCES.map((a, i) => (
        <button
          key={a}
          type="button"
          {...itemProps(i)}
          className={`min-h-11 rounded-full border-[1.5px] px-3.5 py-1.5 text-[11.5px] font-bold transition-colors duration-150 ${
            audience === a ? 'border-bloom-green bg-bloom-green text-on-dark' : 'border-bloom-line-strong bg-white text-ink-soft hover:border-bloom-green'
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  )
}

function SurveyRow({ survey, onChanged }: { survey: ApiSurvey; onChanged: () => void }) {
  const navigate = useNavigate()
  const canResults = survey.status !== 'draft'
  return (
    <li className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <button
          disabled={!canResults}
          onClick={() => navigate(`/surveys/${survey.id}/results`)}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <span className="block truncate text-[13.5px] font-bold">{survey.title}</span>
          <span className="mt-0.5 block text-[11px] text-ink-meta">
            {survey.audience} · {survey.questions.length} questions · {survey.responses} response{survey.responses === 1 ? '' : 's'}
            {survey.closeDate ? ` · closes ${survey.closeDate}` : ''}
            {survey.tracker ? ' · tracker' : ''}
          </span>
        </button>
        <StatusBadge tone={survey.status === 'live' ? 'live' : survey.status === 'draft' ? 'gold' : 'neutral'}>{survey.status}</StatusBadge>
        {survey.status === 'live' || survey.status === 'paused' ? (
          <button
            onClick={async () => {
              await Api.updateSurvey(survey.id, { status: survey.status === 'live' ? 'paused' : 'live' })
              onChanged()
            }}
            aria-label={survey.status === 'live' ? `Pause survey ${survey.title}` : `Resume survey ${survey.title}`}
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-ink"
          >
            {survey.status === 'live' ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
          </button>
        ) : null}
        {survey.status === 'closed' && survey.tracker ? (
          <button
            onClick={async () => {
              await Api.relaunchSurvey(survey.id)
              onChanged()
            }}
            aria-label={`Run survey ${survey.title} again`}
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-bloom-green"
          >
            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <button
          onClick={async () => {
            if (survey.status === 'draft' || survey.status === 'closed') await Api.deleteSurvey(survey.id)
            else await Api.updateSurvey(survey.id, { status: 'closed' })
            onChanged()
          }}
          aria-label={survey.status === 'draft' || survey.status === 'closed' ? `Delete survey ${survey.title}` : `Close survey ${survey.title}`}
          className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-signal-concern"
        >
          {survey.status === 'draft' || survey.status === 'closed' ? <Trash2 aria-hidden="true" className="h-4 w-4" /> : <X aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {canResults ? (
        <Link to={`/surveys/${survey.id}/results`} className="mt-1.5 inline-block text-[11px] font-bold text-bloom-green underline underline-offset-2">
          View results →
        </Link>
      ) : null}
    </li>
  )
}

function GuardrailNotes({ check, onApply }: { check: GuardrailCheck | undefined; onApply: (patch: { text?: string; split?: string[] }) => void }) {
  if (!check || check.findings.length === 0) return null
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {check.findings.map((f, i) => (
        <p key={i} className="rounded-[9px] bg-bloom-gold-tint px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-gold">
          <Flower2 aria-hidden="true" className="mr-1 inline h-3 w-3" />
          {f.message}
          {f.suggestion ? (
            <button
              type="button"
              onClick={() => onApply(f.suggestion!)}
              className="ml-1.5 font-extrabold underline underline-offset-2"
            >
              {f.suggestion.label ?? (f.suggestion.split ? 'Split it' : 'Apply')}
            </button>
          ) : null}
        </p>
      ))}
    </div>
  )
}

/** Survey Builder — real lifecycle against the server (Gate 3). */
export function SurveyBuilder() {
  const me = useMe()
  const { today } = useAppStore()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi(() => Api.surveys(), [])

  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>('My class')
  const [yearGroups, setYearGroups] = useState<YearTier[]>([])
  const [closeDate, setCloseDate] = useState('')
  const [tracker, setTracker] = useState(false)
  const [questions, setQuestions] = useState<SurveyQuestionDraft[]>([{ id: 'bq-1', text: 'New question — tap to edit', options: DEFAULT_OPTIONS }])
  const [nextId, setNextId] = useState(2)
  const [checks, setChecks] = useState<GuardrailCheck[]>([])
  const [banner, setBanner] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const debounceRef = useRef<number | null>(null)

  // Guardrails run on every edit (debounced) — gentle notes, never blockers.
  useEffect(() => {
    if (me.role === 'student') return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await Api.guardrails(questions, yearGroups.length === 1 && yearGroups[0] === 'junior' ? 'junior' : 'senior')
        setChecks(res.checks)
      } catch {
        /* advisory only */
      }
    }, 500)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [questions, yearGroups, me.role])

  if (me.role === 'student') {
    return <PermissionDenied need="The Survey Builder is a teacher and leader surface." />
  }
  if (loading || !today) return <ScreenSkeleton />
  if (error || !data) return <ErrorState body="Your surveys could not be loaded." onRetry={reload} />

  const completed = today.pulsesCompleted
  const unlocked = completed >= UNLOCK_TARGET
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
            {Math.min(completed, UNLOCK_TARGET)} of {UNLOCK_TARGET} pulses completed · {Math.max(0, UNLOCK_TARGET - completed)} to go
          </p>
          <PrimaryButton className="mt-4 text-[13.5px]" onClick={() => navigate('/pulse')}>
            Complete today's pulse →
          </PrimaryButton>
        </div>
      </div>
    )
  }

  const checksById = Object.fromEntries(checks.map((c) => [c.id, c]))

  const launch = async (asDraft: boolean) => {
    if (!canLaunch || busy) return
    setBusy(true)
    setBanner(null)
    try {
      const { survey } = await Api.createSurvey({
        title: title.trim(),
        purpose,
        audience,
        yearGroups: audience === 'Staff' ? [] : yearGroups,
        questions,
        closeDate: closeDate || null,
        tracker,
      })
      if (!asDraft) {
        await Api.launchSurvey(survey.id)
        setBanner('✓ Survey launched. Real responses collate into its results page as voices arrive.')
      } else {
        setBanner('✓ Draft saved. Launch it from Your Surveys when it is ready.')
      }
      setTitle('')
      setPurpose('')
      setCloseDate('')
      setTracker(false)
      setQuestions([{ id: `bq-${nextId}`, text: 'New question — tap to edit', options: DEFAULT_OPTIONS }])
      setNextId((n) => n + 1)
      reload()
      window.scrollTo({ top: 0 })
    } catch {
      setBanner('Something went wrong — nothing was launched. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-4">
      {header}
      {banner ? (
        <div role="status" className="mx-4 mt-3.5 rounded-row border border-[#BFDCC8] bg-[#EAF4EC] px-3.5 py-3 text-[12.5px] font-semibold text-[#2F5E3F] md:mx-0">
          {banner}
        </div>
      ) : null}

      {data.mine.length > 0 ? (
        <section aria-label="Your surveys">
          <MicroLabel className="px-4 pt-4 pb-1.5 text-ink-meta md:px-0">Your surveys</MicroLabel>
          <ul className="flex flex-col gap-2 px-4 md:px-0">
            {data.mine.map((s) => (
              <SurveyRow key={s.id} survey={s} onChanged={reload} />
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
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Survey title — e.g. Homework load check"
            className="w-full rounded-xl border-[1.5px] border-bloom-line-strong bg-[#FDFBF4] px-3.5 py-3 text-sm font-bold outline-none focus:border-bloom-green"
          />
          <label className="mt-2 block">
            <span className="sr-only">Purpose</span>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              maxLength={400}
              placeholder="Purpose — what will this help you decide?"
              className="w-full rounded-xl border border-bloom-line-strong bg-[#FDFBF4] px-3.5 py-2.5 text-[13px] outline-none focus:border-bloom-green"
            />
          </label>
          <AudienceChips audience={audience} onChange={setAudience} />
          {audience !== 'Staff' ? (
            <fieldset className="mt-2.5">
              <legend className="micro-label text-ink-meta">Year groups (optional)</legend>
              <div className="mt-1.5 flex gap-1.5">
                {(['junior', 'senior'] as YearTier[]).map((tier) => {
                  const on = yearGroups.includes(tier)
                  return (
                    <button
                      key={tier}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setYearGroups((prev) => (on ? prev.filter((t) => t !== tier) : [...prev, tier]))}
                      className={`min-h-11 rounded-full border-[1.5px] px-3.5 py-1.5 text-[11.5px] font-bold transition-colors ${
                        on ? 'border-bloom-green bg-bloom-green text-on-dark' : 'border-bloom-line-strong bg-white text-ink-soft hover:border-bloom-green'
                      }`}
                    >
                      {tier === 'junior' ? 'Forms 1–2 / primary' : 'Forms 3–6'}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-[10.5px] text-ink-meta">
                Filtered results stay hidden unless both the group and the rest clear the 20-voice threshold.
              </p>
            </fieldset>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[12.5px] font-semibold">
              Close date
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="rounded-[9px] border border-bloom-line-strong bg-white px-2.5 py-2 text-[12.5px] outline-none focus:border-bloom-green"
              />
              <span className="text-[10.5px] font-normal text-ink-meta">(default 7 days)</span>
            </label>
            <label className="flex items-center gap-2 text-[12.5px] font-semibold">
              Tracker
              <Toggle checked={tracker} onChange={() => setTracker((v) => !v)} label="Run this survey repeatedly as a tracker" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pt-3.5 pb-1.5 md:px-0">
          <MicroLabel className="text-ink-meta">Questions · {questions.length}</MicroLabel>
          <button
            type="button"
            disabled={drafting}
            onClick={async () => {
              setDrafting(true)
              try {
                const res = await Api.draftQuestions(title || purpose || 'general', 3)
                setQuestions((prev) => [...prev, ...res.suggestions.map((sug, i) => ({ id: `bq-${nextId + i}`, text: sug.text, options: sug.options }))])
                setNextId((n) => n + res.suggestions.length)
              } finally {
                setDrafting(false)
              }
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bloom-gold-line bg-bloom-gold-chip px-3.5 py-1.5 text-[11.5px] font-extrabold text-ink-gold transition-colors hover:bg-bloom-gold-line"
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> {drafting ? 'Drafting…' : 'Draft with POUI'}
          </button>
        </div>
        <p className="px-4 pb-1.5 text-[10.5px] text-ink-meta md:px-0">
          POUI suggests — you decide. Suggested questions are added below for you to edit or remove.
        </p>
        <div className="flex flex-col gap-2 px-4 md:px-0">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestions((prev) => prev.map((it, j) => (j === idx ? { ...it, options: it.options ? null : DEFAULT_OPTIONS } : it)))}
                  className="min-h-11 rounded-full bg-bloom-gold-chip px-3 py-1 text-[10px] font-bold text-ink-gold transition-colors hover:bg-bloom-gold-line"
                  aria-label={`Change question type — currently ${q.options ? `choice with ${q.options.length} options` : 'free text'}`}
                >
                  {q.options ? `Choice · ${q.options.length}` : 'Free text'}
                </button>
                <button
                  onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== idx))}
                  aria-label={`Remove question: ${q.text}`}
                  className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-signal-concern"
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
              <GuardrailNotes
                check={checksById[q.id]}
                onApply={(patch) => {
                  if (patch.split) {
                    setQuestions((prev) => {
                      const copy = [...prev]
                      copy.splice(idx, 1, { ...q, text: patch.split![0] }, { id: `bq-${nextId}`, text: patch.split![1], options: q.options })
                      return copy
                    })
                    setNextId((n) => n + 1)
                  } else if (patch.text) {
                    setQuestions((prev) => prev.map((it, j) => (j === idx ? { ...it, text: patch.text! } : it)))
                  }
                }}
              />
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

        <details className="mx-4 mt-3 rounded-row border border-bloom-line bg-white px-3.5 py-3 md:mx-0">
          <summary className="cursor-pointer text-[12.5px] font-bold text-bloom-green">Preview as respondents will see it</summary>
          <ol className="mt-2 flex flex-col gap-2">
            {questions.map((q, i) => (
              <li key={q.id} className="text-[13px]">
                <span className="font-semibold">
                  {i + 1}. {q.text}
                </span>
                <span className="block text-[11px] text-ink-meta">{q.options ? q.options.join(' · ') : 'Open answer'}</span>
              </li>
            ))}
          </ol>
        </details>

        <div className="px-4 pt-3.5 md:px-0">
          <div className="flex gap-2">
            <button
              onClick={() => launch(false)}
              disabled={!canLaunch || busy}
              className="min-h-12 flex-1 rounded-[15px] bg-bloom-gold px-4 py-3.5 text-[14.5px] font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold-bright disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta"
            >
              {busy ? 'Working…' : canLaunch ? 'Launch survey →' : 'Add a title and a question'}
            </button>
            <button
              onClick={() => launch(true)}
              disabled={!canLaunch || busy}
              className="min-h-12 rounded-[15px] border-[1.5px] border-bloom-line-strong px-4 text-[13px] font-bold text-ink-soft transition-colors hover:border-bloom-green disabled:cursor-not-allowed disabled:text-ink-meta"
            >
              Save draft
            </button>
          </div>
          <p className="px-2.5 pt-2.5 pb-4 text-center text-[11px] leading-relaxed text-ink-meta">
            Anonymity is enforced by the school server — results appear only above 20 voices.
          </p>
        </div>
      </section>
    </div>
  )
}
