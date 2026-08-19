import { useState } from 'react'
import type { OneChildEntry } from '../types/survey'
import { looksLikeRealName } from '../services/champion'
import { Card, PrimaryButton } from './ui'

/**
 * One Child anchor (spec § 3.2) — a guarded input that never accepts a real
 * name. Offered after the teacher's Daily Pulse; entirely optional.
 */
export function OneChildEntryForm({ onSubmit, onSkip }: { onSubmit: (e: OneChildEntry) => void; onSkip: () => void }) {
  const [yearGroup, setYearGroup] = useState('')
  const [handle, setHandle] = useState('')
  const [notedFor, setNotedFor] = useState('')
  const [warning, setWarning] = useState<string | null>(null)

  const handleSubmit = () => {
    if (looksLikeRealName(handle) || looksLikeRealName(notedFor)) {
      setWarning('Use a handle (e.g. Y4-073), not a name. The Pulse is anonymised by design.')
      return
    }
    if (!yearGroup.trim() || !handle.trim()) {
      setWarning('Add the year group and an anonymised handle (e.g. F2 and 073).')
      return
    }
    onSubmit({
      pupilHandle: `${yearGroup.trim()}-${handle.trim()}`,
      yearGroup: yearGroup.trim(),
      notedFor: notedFor.trim().slice(0, 120),
      submittedBy: 'teacher-demo',
      submittedAt: new Date().toISOString(),
    })
  }

  return (
    <Card className="text-left">
      <h2 className="font-display text-[17px] font-bold">Is there a child you went home thinking about?</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-meta">
        Optional. Use the year-group + handle convention — never a name. Patterns across staff reach your Champion.
      </p>
      <div className="mt-3 flex gap-2">
        <label className="flex-none">
          <span className="micro-label text-ink-meta">Year group</span>
          <input
            value={yearGroup}
            onChange={(e) => setYearGroup(e.target.value)}
            placeholder="F2"
            className="mt-1 w-20 rounded-[9px] border border-bloom-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
          />
        </label>
        <label className="flex-1">
          <span className="micro-label text-ink-meta">Handle</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="073"
            className="mt-1 w-full rounded-[9px] border border-bloom-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
          />
        </label>
      </div>
      <label className="mt-2.5 block">
        <span className="micro-label text-ink-meta">Noted for</span>
        <textarea
          value={notedFor}
          onChange={(e) => setNotedFor(e.target.value)}
          maxLength={120}
          rows={2}
          placeholder="What you noticed — max 120 characters"
          className="mt-1 w-full resize-y rounded-[9px] border border-bloom-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] outline-none focus:border-bloom-green"
        />
      </label>
      {warning ? (
        <p role="alert" className="mt-2 rounded-[9px] bg-bloom-gold-tint px-3 py-2 text-xs font-semibold text-ink-gold">
          {warning}
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-2.5">
        <PrimaryButton onClick={handleSubmit} className="text-[13px]">
          Note this child
        </PrimaryButton>
        <button onClick={onSkip} className="min-h-11 px-2 text-xs font-bold text-ink-meta underline underline-offset-2">
          Skip
        </button>
      </div>
    </Card>
  )
}
