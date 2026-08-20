import { useState } from 'react'
import { Sheet } from './Sheet'
import { GhostButton } from './ui'
import { Api } from '../services/api'

/**
 * Safeguarding channel (spec § 3.3/4.2): quiet, never urgent-styled. The note
 * goes straight to the server-side Champion queue — the confirmation shows
 * only after the server accepts it, and the text never persists on-device.
 */
export function TellALeaderSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const close = () => {
    onClose()
    setNote('')
    setSent(false)
    setError(false)
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
          {error ? (
            <p role="alert" className="mt-2 rounded-input bg-bloom-gold-tint px-3.5 py-2.5 text-xs font-semibold text-ink-gold">
              Your note could not be sent — it has not been saved anywhere. Please try again.
            </p>
          ) : null}
          <div className="mt-3.5 flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError(false)
                try {
                  await Api.tellALeader(note)
                  setSent(true)
                } catch {
                  setError(true)
                } finally {
                  setBusy(false)
                }
              }}
              className="min-h-11 flex-1 rounded-input bg-ink-burgundy px-4 py-3 text-sm font-extrabold text-[#F5E9D8] transition-colors hover:bg-[#5a2226] disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send to Champion'}
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
