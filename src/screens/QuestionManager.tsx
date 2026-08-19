import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useState } from 'react'
import type { PulseQuestion, Role } from '../types/survey'
import { useAppStore } from '../store/AppStore'
import { PageHeader, ScreenSkeleton, ThemeBadge } from '../components/ui'
import { useLoaded } from '../hooks/useLoaded'

const DEFAULT_OPTIONS = ['Yes', 'Mostly', 'Not really', 'No']

export function QuestionManager() {
  const store = useAppStore()
  const loaded = useLoaded()
  const role = store.account!.role
  const [tab, setTab] = useState<Role>(role === 'student' ? 'student' : role)
  const [nextId, setNextId] = useState(1)

  // Students never manage question banks — role gating, not just hidden UI.
  if (role === 'student') return <Navigate to="/today" replace />
  if (!loaded) return <ScreenSkeleton />

  const bank = store.banks[tab]

  const update = (idx: number, patch: Partial<PulseQuestion>) => {
    const copy = bank.slice()
    copy[idx] = { ...copy[idx], ...patch }
    store.updateBank(tab, copy)
  }

  const tabs: Array<{ key: Role; label: string }> = [
    { key: role, label: role === 'leader' ? 'Leader Pulse' : 'Daily Pulse' },
    { key: 'student', label: 'Pupil carousel' },
  ]

  return (
    <div className="mx-auto max-w-xl pb-4">
      <PageHeader
        title={role === 'leader' ? 'Leader Pulse questions' : 'Carousel questions'}
        sub="Changes update the carousel instantly"
        back={
          <Link to="/pulse" aria-label="Back to pulse" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />

      <div role="tablist" aria-label="Question bank" className="mx-4 mt-3.5 flex rounded-xl bg-bloom-sand p-[3px] md:mx-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-10 flex-1 rounded-[10px] py-2 text-[12.5px] font-bold transition-colors duration-150 ${
              tab === t.key ? 'bg-white text-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3.5 md:px-0">
        {bank.length === 0 ? (
          <p className="rounded-row border border-bloom-line bg-white p-4 text-center text-[12.5px] text-ink-meta">
            No questions in this bank yet — add one below.
          </p>
        ) : null}
        {bank.map((q, idx) => (
          <div key={q.id} className="rounded-row border border-bloom-line bg-white px-3.5 py-3">
            <div className="flex items-center gap-2">
              <ThemeBadge theme={q.theme} />
              <button
                onClick={() =>
                  update(
                    idx,
                    q.options
                      ? { options: undefined, type: 'free_text', scale: false }
                      : { options: DEFAULT_OPTIONS, type: 'single_select', scale: false }
                  )
                }
                className="min-h-11 rounded-full bg-bloom-gold-chip px-3 py-1 text-[10px] font-bold text-ink-gold transition-colors hover:bg-bloom-gold-line"
                aria-label={`Change question type — currently ${q.options ? `choice with ${q.options.length} options` : 'free text'}`}
              >
                {q.options ? `Choice · ${q.options.length}` : 'Free text'}
              </button>
              {q.weekly ? <span className="text-[10px] text-ink-meta">weekly</span> : null}
              <button
                onClick={() => store.updateBank(tab, bank.filter((_, j) => j !== idx))}
                aria-label={`Remove question: ${q.text}`}
                className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-full text-ink-meta transition-colors hover:bg-bloom-cream-dim hover:text-signal-concern"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <label className="sr-only" htmlFor={`q-${q.id}`}>
              Question text
            </label>
            <input
              id={`q-${q.id}`}
              value={q.text}
              onChange={(e) => update(idx, { text: e.target.value })}
              className="mt-2 w-full rounded-[9px] border border-bloom-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
            />
            <p className="mt-1.5 text-[10.5px] text-ink-meta">
              {q.options ? q.options.join(' / ') : 'Open response — optional for pupils'}
            </p>
          </div>
        ))}
        <button
          onClick={() => {
            store.updateBank(tab, [
              ...bank,
              {
                id: `custom-${tab}-${Date.now()}-${nextId}`,
                theme: tab === 'leader' ? 'Action' : 'Voice',
                domain: 'wellness',
                type: 'single_select',
                text: 'New question — tap to edit',
                options: DEFAULT_OPTIONS,
                mark: 'L',
                routesTo: ['SD'],
              },
            ])
            setNextId((n) => n + 1)
          }}
          className="min-h-12 rounded-row border-[1.5px] border-dashed border-bloom-line-strong py-3 text-[13px] font-bold text-ink-meta transition-colors hover:border-bloom-green hover:text-bloom-green"
        >
          + Add question
        </button>
        <p className="px-1 pb-4 text-[11px] leading-relaxed text-ink-meta">
          {tab === 'student'
            ? 'Bloom rotates 3–5 questions per pupil per day from this bank; the reflection question appears weekly. Tap the type chip to switch choice / free text.'
            : tab === 'leader'
              ? 'Five decision-oriented questions, weekly. Tap the type chip to switch choice / free text.'
              : 'Your two-minute Daily Pulse. Every question carries a Synodal Mark. Tap the type chip to switch choice / free text.'}
        </p>
      </div>
    </div>
  )
}
