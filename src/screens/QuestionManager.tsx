import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { PageHeader, ThemeBadge } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../SessionContext'
import { getBank, saveBank } from '../services/pulses'
import type { PulseQuestion } from '../types/pulse'
import type { SynodalMark } from '../types/synodal'

/* Question manager (teacher/leader): inline edit, choice ↔ free-text toggle and
   removal, applied to the carousel instantly through the shared bank. */

export function QuestionManager() {
  const { session } = useSession()
  const role = session.role
  const { data, loading, error, reload } = useAsync(() => getBank(role), [role])
  const [bank, setBank] = useState<PulseQuestion[] | null>(null)

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const questions = bank ?? data
  const update = (next: PulseQuestion[]) => {
    setBank(next)
    saveBank(role, next)
  }

  const patch = (idx: number, changes: Partial<PulseQuestion>) =>
    update(questions.map((q, i) => (i === idx ? { ...q, ...changes } : q)))

  return (
    <Screen>
      <PageHeader
        title={role === 'leader' ? 'Leader Pulse questions' : 'Carousel questions'}
        subtitle="Changes update the carousel instantly"
        back={
          <Link to="/pulse" aria-label="Back to the pulse" className="hit-target grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-cream-dim">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />
      <ul className="flex list-none flex-col gap-2 px-4 pt-3.5 md:grid md:grid-cols-2 md:items-start md:px-0">
        {questions.map((q, idx) => (
          <li key={q.id} className="rounded-input border border-line bg-white p-3">
            <div className="flex items-center gap-2">
              <ThemeBadge theme={q.theme} mark={role === 'teacher' ? (q.theme as SynodalMark) : undefined} />
              <button
                type="button"
                onClick={() => patch(idx, { options: Array.isArray(q.options) ? null : ['Yes', 'Mostly', 'Not really', 'No'] })}
                className="hit-target rounded-chip bg-gold-chip px-2.5 py-1 text-[10px] font-bold text-gold-ink hover:brightness-95"
                aria-label={`Change question type, currently ${Array.isArray(q.options) ? 'choice' : 'free text'}`}
              >
                {Array.isArray(q.options) ? `Choice · ${q.options.length}` : 'Free text'}
              </button>
              {q.weekly && <span className="text-[10px] text-meta">weekly</span>}
              <button
                type="button"
                onClick={() => update(questions.filter((_, i) => i !== idx))}
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
                onChange={(e) => patch(idx, { text: e.target.value })}
                className="w-full rounded-[9px] border border-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] text-ink outline-none focus:border-green"
              />
            </label>
            <p className="mt-1.5 truncate text-[10.5px] text-meta">
              {Array.isArray(q.options) ? q.options.join(' / ') : 'Open response — optional for pupils'}
            </p>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() =>
              update([
                ...questions,
                {
                  id: crypto.randomUUID(),
                  theme: role === 'leader' ? 'Action' : role === 'teacher' ? 'L' : 'Voice',
                  text: 'New question — tap to edit',
                  options: ['Yes', 'Mostly', 'Not really', 'No'],
                  mark: 'L',
                  routesTo: ['SD'],
                },
              ])
            }
            className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-input border-[1.5px] border-dashed border-line-strong px-3 text-[13px] font-bold text-ink-soft hover:border-green hover:text-green"
          >
            <Plus aria-hidden="true" className="h-4 w-4" /> Add question
          </button>
        </li>
      </ul>
      <p className="px-5 pb-4 pt-2 text-[11px] leading-relaxed text-meta md:px-0">
        {role === 'leader'
          ? 'Five decision-oriented questions, weekly. Tap the type chip to switch choice / free text.'
          : 'Bloom rotates 3–5 questions per pupil per day from this bank; the reflection question appears weekly. Tap the type chip to switch choice / free text.'}
      </p>
    </Screen>
  )
}
