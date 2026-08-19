import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Flower2, Plus, X } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { Button, Card, MicroLabel, PageHeader, ProgressBar, StatusBadge } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../SessionContext'
import { getPulsesCompleted, UNLOCK_THRESHOLD } from '../services/pulses'
import { ANONYMITY_THRESHOLD, deleteSurvey, getSurveys, launchSurvey, setSurveyStatus } from '../services/surveys'
import type { Survey, SurveyAudience, SurveyQuestion } from '../types/pulse'

const AUDIENCES: SurveyAudience[] = ['My class', 'Whole school', 'Staff']

export function SurveyBuilder() {
  const { session } = useSession()
  const role = session.role
  const { data, loading, error, reload } = useAsync(
    () => ({ completed: getPulsesCompleted(role), surveys: getSurveys(role) }),
    [role],
  )

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const unlocked = data.completed >= UNLOCK_THRESHOLD

  return (
    <Screen>
      <PageHeader
        title="Survey Builder"
        subtitle="Turn your idea into a live pulse"
        back={
          <Link to="/today" aria-label="Back to Today" className="hit-target grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-cream-dim">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />
      {unlocked ? (
        <UnlockedBuilder initialSurveys={data.surveys} onChanged={reload} />
      ) : (
        <LockedState completed={data.completed} />
      )}
    </Screen>
  )
}

function LockedState({ completed }: { completed: number }) {
  const navigate = useNavigate()
  const remaining = UNLOCK_THRESHOLD - completed
  return (
    <div className="px-4 pt-5 md:px-0">
      <Card className="mx-auto max-w-md !rounded-[20px] p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-chip">
          <Flower2 aria-hidden="true" className="h-6 w-6 text-gold-ink" />
        </div>
        <h2 className="font-display mt-3 text-xl font-extrabold text-green">Blooms with your voice</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
          The Survey Builder unlocks after <b>{UNLOCK_THRESHOLD} completed pulses</b> — so every survey is built by
          someone who answers them too.
        </p>
        <ProgressBar
          value={completed}
          max={UNLOCK_THRESHOLD}
          label={`Unlock progress: ${completed} of ${UNLOCK_THRESHOLD} pulses completed`}
          className="mt-4"
        />
        <p className="mt-2 text-xs font-bold text-gold-ink">
          {completed} of {UNLOCK_THRESHOLD} pulses completed · {remaining} pulse{remaining === 1 ? '' : 's'} to go
        </p>
        <Button className="mt-4" onClick={() => navigate('/pulse')}>
          Complete today's pulse →
        </Button>
      </Card>
    </div>
  )
}

function newDraftQuestion(): SurveyQuestion {
  return { id: crypto.randomUUID(), text: 'New question — tap to edit', options: ['Yes', 'Mostly', 'Not really', 'No'] }
}

function UnlockedBuilder({ initialSurveys, onChanged }: { initialSurveys: Survey[]; onChanged: () => void }) {
  const { session } = useSession()
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState<SurveyAudience>('My class')
  const [draft, setDraft] = useState<SurveyQuestion[]>([newDraftQuestion()])
  const [surveys, setSurveys] = useState(initialSurveys)
  const [justLaunched, setJustLaunched] = useState(false)

  const canLaunch = title.trim().length > 0 && draft.length > 0

  const refresh = () => {
    setSurveys(getSurveys(session.role))
    onChanged()
  }

  return (
    <div className="grid gap-1 px-4 pt-1 md:grid-cols-2 md:gap-6 md:px-0">
      <div>
        {justLaunched && (
          <div role="status" className="mt-3.5 rounded-input border border-success-line bg-success-bg px-3.5 py-3 text-[12.5px] font-semibold text-success-text">
            ✓ Survey launched. Responses will collate into Trends within 24 hours.
          </div>
        )}

        <MicroLabel className="px-1 pb-1.5 pt-4 text-meta">New survey</MicroLabel>
        <Card>
          <label className="block">
            <span className="sr-only">Survey title</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setJustLaunched(false)
              }}
              maxLength={80}
              placeholder="Survey title — e.g. Homework load check"
              className="w-full rounded-xl border-[1.5px] border-line-strong bg-[#FDFBF4] px-3 py-3 text-sm font-bold text-ink outline-none focus:border-green"
            />
          </label>
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Audience">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={audience === a}
                onClick={() => setAudience(a)}
                className={`min-h-11 rounded-chip border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                  audience === a ? 'border-green bg-green text-ondark' : 'border-line-strong bg-white text-ink-soft hover:border-green'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        <MicroLabel className="px-1 pb-1.5 pt-3.5 text-meta">Questions · {draft.length}</MicroLabel>
        <ul className="flex list-none flex-col gap-2">
          {draft.map((q, idx) => (
            <li key={q.id} className="rounded-input border border-line bg-white p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft(draft.map((d, i) => (i === idx ? { ...d, options: Array.isArray(d.options) ? null : ['Yes', 'Mostly', 'Not really', 'No'] } : d)))
                  }
                  className="hit-target rounded-chip bg-gold-chip px-2.5 py-1 text-[10px] font-bold text-gold-ink hover:brightness-95"
                  aria-label={`Change question type, currently ${Array.isArray(q.options) ? 'choice' : 'free text'}`}
                >
                  {Array.isArray(q.options) ? `Choice · ${q.options.length}` : 'Free text'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  aria-label={`Remove question: ${q.text}`}
                  className="hit-target ml-auto grid h-7 w-7 place-items-center rounded-full text-meta hover:bg-cream-dim hover:text-concern-text"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-2 block">
                <span className="sr-only">Question text</span>
                <input
                  value={q.text}
                  onChange={(e) => setDraft(draft.map((d, i) => (i === idx ? { ...d, text: e.target.value } : d)))}
                  className="w-full rounded-[9px] border border-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] text-ink outline-none focus:border-green"
                />
              </label>
              <p className="mt-1.5 truncate text-[10.5px] text-meta">
                {Array.isArray(q.options) ? q.options.join(' / ') : 'Open response — optional'}
              </p>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setDraft([...draft, newDraftQuestion()])}
              className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-input border-[1.5px] border-dashed border-line-strong px-3 text-[13px] font-bold text-ink-soft hover:border-green hover:text-green"
            >
              <Plus aria-hidden="true" className="h-4 w-4" /> Add question
            </button>
          </li>
        </ul>

        <div className="pt-3.5">
          <Button
            variant="gold"
            className="w-full !py-3.5 text-[14.5px]"
            disabled={!canLaunch}
            onClick={() => {
              if (!canLaunch) return
              launchSurvey({ ownerRole: session.role, title, audience, questions: draft })
              setTitle('')
              setDraft([newDraftQuestion()])
              setJustLaunched(true)
              refresh()
            }}
          >
            {canLaunch ? 'Launch survey →' : 'Add a title and a question'}
          </Button>
          <p className="px-2 pb-4 pt-2.5 text-center text-[11px] leading-relaxed text-meta">
            Anonymity thresholds apply automatically — results appear only above {ANONYMITY_THRESHOLD} voices.
          </p>
        </div>
      </div>

      <div>
        {surveys.length > 0 && (
          <>
            <MicroLabel className="px-1 pb-1.5 pt-4 text-meta">Your surveys</MicroLabel>
            <ul className="flex list-none flex-col gap-2">
              {surveys.map((s) => (
                <SurveyRow key={s.id} survey={s} onChanged={refresh} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

/** Launched surveys carry a full lifecycle: pause, resume, close, delete
    (DESIGN_REVIEW P2-10). */
function SurveyRow({ survey, onChanged }: { survey: Survey; onChanged: () => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const tone = survey.status === 'live' ? 'live' : survey.status === 'paused' ? 'paused' : 'closed'
  const below = survey.responses < ANONYMITY_THRESHOLD

  return (
    <li className="rounded-input border border-line bg-white px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-bold" title={survey.title}>
            {survey.title}
          </div>
          <div className="mt-0.5 text-[11px] text-meta">
            {survey.audience} · {survey.questions.length} question{survey.questions.length === 1 ? '' : 's'} ·{' '}
            {survey.responses} response{survey.responses === 1 ? '' : 's'}
            {below && survey.status !== 'closed' && ' · results hidden below 20 voices'}
          </div>
        </div>
        <StatusBadge tone={tone}>{survey.status.toUpperCase()}</StatusBadge>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold">
        {survey.status === 'live' && (
          <button type="button" className="min-h-11 text-gold-ink underline underline-offset-2 hover:text-ink" onClick={() => { setSurveyStatus(survey.id, 'paused'); onChanged() }}>
            Pause
          </button>
        )}
        {survey.status === 'paused' && (
          <button type="button" className="min-h-11 text-success-text underline underline-offset-2 hover:text-ink" onClick={() => { setSurveyStatus(survey.id, 'live'); onChanged() }}>
            Resume
          </button>
        )}
        {survey.status !== 'closed' && (
          <button type="button" className="min-h-11 text-ink-soft underline underline-offset-2 hover:text-ink" onClick={() => { setSurveyStatus(survey.id, 'closed'); onChanged() }}>
            Close
          </button>
        )}
        {!confirmingDelete ? (
          <button type="button" className="min-h-11 text-concern-text underline underline-offset-2" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-meta">Delete this survey and its responses?</span>
            <button type="button" className="min-h-11 text-concern-text underline underline-offset-2" onClick={() => { deleteSurvey(survey.id); onChanged() }}>
              Yes, delete
            </button>
            <button type="button" className="min-h-11 text-ink-soft underline underline-offset-2" onClick={() => setConfirmingDelete(false)}>
              Keep
            </button>
          </span>
        )}
      </div>
    </li>
  )
}
