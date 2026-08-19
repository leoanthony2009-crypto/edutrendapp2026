import { ChevronLeft, X } from "lucide-react";
import { useStore } from "../lib/store";
import type { Screen } from "../types";
import { ThemeBadge } from "../components/ui";

// Question manager (teacher/leader): edits apply to the carousel instantly.
export function Manage({ go }: { go: (s: Screen) => void }) {
  const { state, dispatch } = useStore();
  const role = state.role;
  const bank = state.banks[role];

  return (
    <div className="md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <button
          onClick={() => go("pulse")}
          aria-label="Back to pulse"
          className="grid h-11 w-11 flex-none place-items-center rounded-full text-meta-faint"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <div>
          <h2 className="font-display text-[22px] font-extrabold">
            {role === "leader" ? "Leader Pulse questions" : "Carousel questions"}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-meta">Changes update the carousel instantly</p>
        </div>
      </div>

      <div className="flex flex-col gap-[9px] px-4 pt-3.5">
        {bank.map((q, idx) => (
          <div key={q.id} className="rounded-input border border-border-soft bg-white px-[13px] py-[11px]">
            <div className="flex items-center gap-2">
              <ThemeBadge theme={q.theme} />
              <button
                onClick={() =>
                  dispatch({
                    type: "editBankQuestion",
                    role,
                    index: idx,
                    patch: { opts: Array.isArray(q.opts) ? null : ["Yes", "Mostly", "Not really", "No"] },
                  })
                }
                className="rounded-full bg-gold-chip px-2.5 py-1.5 text-[10px] font-bold text-gold-ink"
              >
                {Array.isArray(q.opts) ? `Choice · ${q.opts.length}` : "Free text"}
              </button>
              {q.weekly && <span className="text-[10px] text-meta">weekly</span>}
              <button
                onClick={() => dispatch({ type: "removeBankQuestion", role, index: idx })}
                aria-label={`Remove question: ${q.text}`}
                className="ml-auto grid h-11 w-11 place-items-center rounded-full text-meta-faint"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
            <label htmlFor={`mq-${q.id}`} className="sr-only">
              Question text
            </label>
            <input
              id={`mq-${q.id}`}
              value={q.text}
              onChange={(e) =>
                dispatch({ type: "editBankQuestion", role, index: idx, patch: { text: e.target.value } })
              }
              className="mt-2 w-full rounded-[9px] border border-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] text-ink outline-none focus:border-green"
            />
            <p className="mt-1.5 text-[10.5px] text-meta">
              {Array.isArray(q.opts) ? q.opts.join(" / ") : "Open response — optional for pupils"}
            </p>
          </div>
        ))}

        <button
          onClick={() => dispatch({ type: "addBankQuestion", role })}
          className="rounded-input border-[1.5px] border-dashed border-[#C4BFAF] p-3 text-center text-[13px] font-bold text-meta-faint"
        >
          + Add question
        </button>
        <p className="px-1 pb-4 pt-0.5 text-[11px] leading-relaxed text-meta">
          {role === "leader"
            ? "Five decision-oriented questions, weekly. Tap the type chip to switch choice / free text."
            : "Bloom rotates 3–5 questions per pupil per day from this bank; the reflection question appears weekly. Tap the type chip to switch choice / free text."}
        </p>
      </div>
    </div>
  );
}
