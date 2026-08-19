import { useStore, dateKey } from "../lib/store";
import type { Screen } from "../types";
import { SCHOOL_NAME } from "../data/insights";
import { MicroLabel } from "../components/ui";

export function TodayStudent({ go }: { go: (s: Screen) => void }) {
  const { state } = useStore();
  const submitted = state.submittedOn.student === dateKey();

  return (
    <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
      <div>
        <div className="px-4 pt-4 md:px-0">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Your voice today</h2>
          <p className="mt-1 text-xs text-meta">Form 2 · {SCHOOL_NAME}</p>
        </div>

        <section className="mx-4 mt-3.5 rounded-card bg-green p-[18px] text-on-dark on-dark md:mx-0">
          <h3 className="font-display text-lg font-bold leading-snug">
            {submitted ? "Thank you — your voice was heard today." : "Five quick questions. Say how today really felt."}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-on-dark-dim">
            {submitted
              ? "Your answers joined 164 other voices. Adults see patterns, never names."
              : 'It takes about two minutes. You can skip anything, and "prefer not to say" is always okay.'}
          </p>
          <button
            onClick={() => go("pulse")}
            className="mt-3.5 inline-block rounded-row bg-gold-bright px-[22px] py-3 text-[13.5px] font-extrabold text-charcoal"
          >
            {submitted ? "See or change my answers" : "Start · Your Voice Today"}
          </button>
        </section>

        <div className="mx-4 mt-3 flex gap-2.5 md:mx-0">
          <div className="card flex-1 rounded-2xl p-[13px]">
            <div className="font-display text-[22px] font-extrabold text-green">{state.streak}</div>
            <div className="text-[11px] text-meta">days in a row your voice was heard</div>
          </div>
          <div className="card flex-1 rounded-2xl p-[13px]">
            <div className="font-display text-[22px] font-extrabold text-gold">2 min</div>
            <div className="text-[11px] text-meta">is all it takes — 5 questions today</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mx-4 mt-3 rounded-2xl border border-gold-tint-border bg-gold-tint p-3.5 text-xs leading-relaxed text-gold-ink md:mx-0 md:mt-4">
          <b>Private by design.</b> Teachers see class patterns, never your name next to an answer. If
          something worries an adult who should help, only your school's Pastoral Champion is told.
        </div>

        <section className="card mx-4 mb-4 mt-3 rounded-2xl p-3.5 md:mx-0">
          <MicroLabel>This week in your school</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
            More students said someone made their day better — the Form 1 buddy scheme is working.
            Thanks for speaking up.
          </p>
        </section>
      </div>
    </div>
  );
}
