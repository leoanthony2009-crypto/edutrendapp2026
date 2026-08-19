import { useState } from "react";
import { useStore } from "../lib/store";
import { Sheet } from "../components/ui";

// "Tell a leader" — quiet safeguarding channel (PASTORAL_PULSE_SPEC.md §4.2).
// Submitting queues a ChampionAlert unconditionally; wording deliberately calm.
export function TellALeaderSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Sheet title="Tell a leader" onClose={onClose}>
      {!sent ? (
        <>
          <h2 className="font-display text-xl font-extrabold text-charcoal">Tell a leader</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6B6F5F]">
            A quiet channel. Your note goes to <b>your Pastoral Champion</b>, who reads it within 24
            hours. It is not an emergency alert.
          </p>
          <label htmlFor="tell-note" className="sr-only">
            Optional note for your Pastoral Champion
          </label>
          <textarea
            id="tell-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note — what should they know?"
            maxLength={400}
            className="mt-3.5 min-h-[88px] w-full resize-y rounded-row border-[1.5px] border-border-strong bg-white px-3.5 py-[13px] text-[13.5px] outline-none focus:border-green"
          />
          <div className="mt-3.5 flex gap-[9px]">
            <button
              onClick={onClose}
              className="rounded-row border-[1.5px] border-border-strong px-[18px] py-[13px] text-[13px] font-bold text-meta-faint"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                dispatch({ type: "tellALeader", note });
                setSent(true);
              }}
              className="flex-1 rounded-row bg-safety py-[13px] text-center text-sm font-extrabold text-[#F5E9D8]"
            >
              Send to Champion
            </button>
          </div>
        </>
      ) : (
        <div className="px-1.5 pb-1 pt-2 text-center" role="status">
          <div className="text-[30px] text-green" aria-hidden>✓</div>
          <h2 className="mt-1.5 font-display text-[19px] font-extrabold text-green">
            A leader will read this within 24 hours
          </h2>
          <p className="mt-1.5 text-xs text-meta">Nothing more is needed from you right now.</p>
          <button
            onClick={onClose}
            className="mt-3.5 inline-block rounded-row bg-green px-6 py-[11px] text-[13px] font-extrabold text-on-dark"
          >
            Done
          </button>
        </div>
      )}
    </Sheet>
  );
}
