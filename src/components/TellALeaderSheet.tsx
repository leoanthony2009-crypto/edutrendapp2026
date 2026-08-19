import { useState } from 'react'
import { Sheet } from './Sheet'
import { GhostButton } from './ui'
import { useAppStore } from '../store/AppStore'

/**
 * Safeguarding channel (spec § 3.3/4.2): quiet, never urgent-styled. Queues a
 * ChampionAlert; the sender only sees the 24-hour confirmation.
 */
export function TellALeaderSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tellALeader } = useAppStore()
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => {
    onClose()
    setNote('')
    setSent(false)
  }

  return (
    <Sheet open={open} onClose={close} label="Tell a leader">
      {sent ? (
        <div role="status" className="px-1.5 py-2 text-center">
          <div aria-hidden="true" className="text-3xl text-bloom-green">
            ✓
          </div>
          <h2 className="mt-1.5 font-display text-lg font-extrabold text-bloom-green">A leader will read this within 24 hours</h2>
          <p className="mt-1.5 text-xs text-ink-meta">Nothing more is needed from you right now.</p>
          <button
            onClick={close}
            className="mt-3.5 min-h-11 rounded-input bg-bloom-green px-6 py-2.5 text-[13px] font-extrabold text-on-dark"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <h2 className="font-display text-xl font-extrabold text-ink">Tell a leader</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
            A quiet channel. Your note goes to <b>your Pastoral Champion</b>, who reads it within 24 hours. It is not an
            emergency alert.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note — what should they know?"
            aria-label="Optional note for your Pastoral Champion"
            rows={3}
            className="mt-3.5 w-full resize-y rounded-input border-[1.5px] border-bloom-line-strong bg-white px-3.5 py-3 text-[13.5px] outline-none focus:border-bloom-green"
          />
          <div className="mt-3.5 flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <button
              onClick={() => {
                tellALeader(note)
                setSent(true)
              }}
              className="min-h-11 flex-1 rounded-input bg-ink-burgundy px-4 py-3 text-sm font-extrabold text-[#F5E9D8] transition-colors hover:bg-[#5a2226]"
            >
              Send to Champion
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
