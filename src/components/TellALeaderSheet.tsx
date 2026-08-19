import { useState } from 'react'
import { Check } from 'lucide-react'
import { Sheet } from './Sheet'
import { Button } from './primitives'
import { queueAlert } from '../services/champion'

/** Safeguarding bottom sheet — a calm, always-available channel to the Pastoral
    Champion (PASTORAL_PULSE_SPEC § 3.3). Never styled as an emergency. */
export function TellALeaderSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => {
    setNote('')
    setSent(false)
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} title="Tell a leader" showClose={!sent}>
      {!sent ? (
        <>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
            A quiet channel. Your note goes to <b>your Pastoral Champion</b>, who reads it within 24 hours. It is not
            an emergency alert.
          </p>
          <label className="mt-3.5 block">
            <span className="sr-only">Optional note for your Pastoral Champion</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note — what should they know?"
              rows={3}
              maxLength={500}
              className="w-full resize-y rounded-row border-[1.5px] border-line-strong bg-white p-3.5 text-[13.5px] leading-relaxed outline-none focus:border-green"
            />
          </label>
          <div className="mt-3.5 flex gap-2.5">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              className="flex-1 !bg-safety !text-[#F5E9D8] hover:!bg-[#5A2226]"
              onClick={() => {
                queueAlert({
                  triggerType: 'safeguarding',
                  context: note.trim() || 'Safeguarding channel opened — no note left.',
                  marks: ['L'],
                })
                setSent(true)
              }}
            >
              Send to Champion
            </Button>
          </div>
        </>
      ) : (
        <div className="px-1.5 pt-2 text-center" role="status">
          <Check aria-hidden="true" className="mx-auto h-8 w-8 text-green" />
          <h3 className="font-display mt-1.5 text-[19px] font-extrabold text-green">
            A leader will read this within 24 hours
          </h3>
          <p className="mt-1.5 text-xs text-meta">Nothing more is needed from you right now.</p>
          <Button className="mt-3.5" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Sheet>
  )
}
