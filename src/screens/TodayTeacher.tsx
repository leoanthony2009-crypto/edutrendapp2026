import { ExternalLink } from "lucide-react";
import { useStore, dateKey } from "../lib/store";
import type { Screen } from "../types";
import { POUI_GPT_URL } from "../data/insights";
import { MicroLabel, Meter } from "../components/ui";
import { pulseDelta, pulseState, series7, todayScore } from "../lib/pulseSeries";
import { BuilderPromoCard } from "./BuilderPromo";

const LAND_ROWS = [
  { label: "Mostly", pct: 48, color: "#5BAA70" },
  { label: "Some", pct: 29, color: "#C8A951" },
  { label: "Hardly", pct: 15, color: "#E19A45" },
  { label: "Not at all", pct: 8, color: "#D9634E" },
];

export function TodayTeacher({ go, onTell }: { go: (s: Screen) => void; onTell: () => void }) {
  const { state, dispatch } = useStore();
  const submitted = state.submittedOn.teacher === dateKey();
  const score = todayScore(state.todayAvg);
  const delta = pulseDelta(state.todayAvg);
  const d7 = series7(state.todayAvg);
  const respCount = 165 + (submitted ? 1 : 0);

  return (
    <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
      <div>
        <div className="px-4 pt-4 md:px-0">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Today's Insights</h2>
          <p className="mt-1 text-xs text-meta">Pastoral Pulse · You + 164 · updated 3:40 pm</p>
        </div>

        <section
          className="relative mx-4 mt-3.5 overflow-hidden rounded-card bg-green p-4 text-on-dark on-dark md:mx-0"
          aria-label={`Pastoral Pulse ${score} out of 100, ${pulseState(delta).toLowerCase()}, ${
            delta >= 0 ? "up" : "down"
          } ${Math.abs(delta)} versus last week`}
        >
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-gold-bright/10" aria-hidden />
          <MicroLabel className="text-gold">Pastoral Pulse · {pulseState(delta)}</MicroLabel>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-[40px] font-extrabold text-gold-bright">{score}</span>
            <span className="text-xs text-on-dark-dim">
              / 100 · {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} vs last week
            </span>
          </div>
          <div className="mt-2 flex h-[30px] items-end gap-1" aria-hidden>
            {d7.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-[3px]"
                style={{ height: Math.round(v * 0.42), background: i === 6 ? "#E9B93B" : "rgba(243,239,226,.3)" }}
              />
            ))}
          </div>
          <p className="sr-only">Last seven school days: {d7.join(", ")} out of 100.</p>
          <p className="mt-2 text-[11px] text-on-dark-dim">
            {submitted ? "Includes your pulse from today ✓" : "Your pulse is not in yet — it takes two minutes."}
          </p>
        </section>

        <section className="card mx-4 mt-3 p-[15px] md:mx-0">
          <div className="flex justify-between gap-2">
            <h3 className="text-[14.5px] font-semibold leading-snug">Did today's lessons make sense to your class?</h3>
            <span
              title="Learning"
              className="flex-none rounded-md bg-discerning px-[7px] py-1 text-[10px] font-extrabold text-white"
            >
              L
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {LAND_ROWS.map((r) => (
              <div key={r.label} className="grid grid-cols-[64px_1fr_32px] items-center gap-2">
                <span className="text-right text-[11px] text-meta-faint">{r.label}</span>
                <Meter value={r.pct} color={r.color} height={11} label={`${r.label}: ${r.pct} percent`} />
                <span className="text-[11px] font-bold text-ink-2">{r.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-meta">{respCount} voices · school average 71%</p>
        </section>

        <section className="mx-4 mt-3 rounded-card border border-[#DCD3E8] bg-white p-[15px] md:mx-0">
          <MicroLabel className="text-self-emptying">Worth noticing</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
            Several pupils who reported low belonging this week also said they were unsure who they
            could speak to. A gentle check-in may help — Bloom never diagnoses the reason.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1 text-[11px] font-semibold text-[#6E548D]">Low belonging</span>
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1 text-[11px] font-semibold text-[#6E548D]">+ No trusted adult</span>
            <span className="rounded-full bg-cream-dim px-2.5 py-1 text-[11px] font-semibold text-meta">7 pupils · anonymised</span>
          </div>
        </section>
      </div>

      <div>
        <section className="mx-4 mt-3 rounded-card border border-gold-tint-border bg-gold-tint p-[15px] md:mx-0 md:mt-4">
          <MicroLabel className="text-gold-ink">POUI micro-move</MicroLabel>
          <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-[#4A4636]">
            "Tomorrow's first ten minutes — water, windows, a song they choose."
          </p>
          <p className="mt-1.5 text-[11px] text-meta">Suggested because today felt heavy in your class's pulses.</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => dispatch({ type: "toggleMoveTried" })}
              aria-pressed={state.moveTried}
              className={`rounded-[10px] px-3 py-2.5 text-[11.5px] font-bold transition-colors ${
                state.moveTried ? "bg-green text-on-dark" : "bg-gold-chip text-gold-ink"
              }`}
            >
              {state.moveTried ? "Tried ✓" : "Mark as tried"}
            </button>
            <button
              onClick={() => dispatch({ type: "toggleMoveSaved" })}
              aria-pressed={state.moveSaved}
              className="rounded-[10px] border border-border-strong px-3 py-2.5 text-[11.5px] font-bold text-ink-2"
            >
              {state.moveSaved ? "Saved ✓" : "Save"}
            </button>
            <a
              href={POUI_GPT_URL}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 rounded-[10px] bg-charcoal px-3 py-2.5 text-[11.5px] font-extrabold text-gold-bright no-underline"
            >
              Ask POUI GPT <ExternalLink size={11} aria-hidden />
            </a>
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-meta">
            POUI GPT generates more micro-moves from your pulse responses, grounded in Bloom's
            research base. Opens outside Bloom, in ChatGPT.
          </p>
        </section>

        <section className="mx-4 mt-3 rounded-card bg-charcoal p-[15px] text-[#EFF3ED] on-dark md:mx-0">
          <MicroLabel className="text-self-emptying">One Child · Watchlist</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            <b>F2-073</b> noted by 3 staff across 4 days. Your Champion reads within 24 hours.
          </p>
        </section>

        <BuilderPromoCard role="teacher" go={go} />

        <div className="mx-5 mb-4 mt-3 md:mx-0">
          <button
            onClick={onTell}
            className="min-h-[44px] text-xs text-safety underline underline-offset-[3px]"
          >
            Tell a leader · 24-hour Champion read
          </button>
        </div>
      </div>
    </div>
  );
}
