import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useStore } from "../lib/store";
import type { Screen } from "../types";
import { MicroLabel, Meter } from "../components/ui";

const AUDIENCES = ["My class", "Whole school", "Staff"];

export function Builder({ go }: { go: (s: Screen) => void }) {
  const { state, dispatch } = useStore();
  const role = state.role;
  const done = state.pulsesCompleted[role] ?? 0;
  const unlocked = done >= 10 && role !== "student";

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("My class");
  const [justLaunched, setJustLaunched] = useState(false);

  const canLaunch = title.trim().length > 0 && state.builderQs.length > 0;
  const mySurveys = state.mySurveys[role] ?? [];

  return (
    <div className="md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <button
          onClick={() => go("today")}
          aria-label="Back to Today"
          className="grid h-11 w-11 flex-none place-items-center rounded-full text-meta-faint"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <div>
          <h2 className="font-display text-[22px] font-extrabold">Survey Builder</h2>
          <p className="mt-0.5 text-[11.5px] text-meta">Turn your idea into a live pulse</p>
        </div>
      </div>

      {!unlocked ? (
        <div className="card mx-4 mt-5 rounded-[20px] p-[26px] px-[22px] text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-chip text-[22px] text-gold" aria-hidden>
            ✿
          </div>
          <h3 className="mt-3 font-display text-xl font-extrabold text-green">Blooms with your voice</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6B6F5F]">
            The Survey Builder unlocks after <b>10 completed pulses</b> — so every survey is built by
            someone who answers them too.
          </p>
          <div className="mt-4">
            <Meter
              value={Math.min(100, (done / 10) * 100)}
              height={8}
              label={`${Math.min(10, done)} of 10 pulses completed`}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-gold-ink">
            {Math.min(10, done)} of 10 pulses completed · {Math.max(0, 10 - done)}{" "}
            {10 - done === 1 ? "pulse" : "pulses"} to go
          </p>
          <button
            onClick={() => go("pulse")}
            className="mt-4 inline-block rounded-row bg-green px-6 py-3 text-[13.5px] font-extrabold text-on-dark"
          >
            Complete today's pulse →
          </button>
        </div>
      ) : (
        <>
          {justLaunched && (
            <div
              role="status"
              className="mx-4 mt-3.5 rounded-input border border-[#BFDCC8] bg-[#EAF4EC] px-3.5 py-3 text-[12.5px] font-semibold text-[#2F5E3F]"
            >
              ✓ Survey launched. Responses will collate into Trends within 24 hours.
            </div>
          )}

          {mySurveys.length > 0 && (
            <>
              <MicroLabel className="px-[18px] pb-1.5 pt-4 text-meta">Your surveys</MicroLabel>
              <div className="flex flex-col gap-2 px-4">
                {mySurveys.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-input border border-border-soft bg-white px-3.5 py-3">
                    <div className="flex-1">
                      <div className="text-[13.5px] font-bold">{m.title}</div>
                      <div className="mt-0.5 text-[11px] text-meta">
                        {m.audience} · {m.qCount} questions · {m.responses} responses
                      </div>
                    </div>
                    <span className="rounded-full bg-[#EAF4EC] px-[9px] py-1 text-[10px] font-extrabold text-[#2F5E3F]">
                      LIVE
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <MicroLabel className="px-[18px] pb-1.5 pt-4 text-meta">New survey</MicroLabel>
          <div className="card mx-4 p-[15px]">
            <label htmlFor="b-title" className="sr-only">
              Survey title
            </label>
            <input
              id="b-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setJustLaunched(false);
              }}
              placeholder="Survey title — e.g. Homework load check"
              className="w-full rounded-xl border-[1.5px] border-border-strong bg-[#FDFBF4] px-[13px] py-3 text-sm font-bold text-ink outline-none focus:border-green"
            />
            <div role="radiogroup" aria-label="Audience" className="mt-[11px] flex gap-[7px]">
              {AUDIENCES.map((a) => {
                const sel = audience === a;
                return (
                  <button
                    key={a}
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setAudience(a)}
                    className={`min-h-[38px] rounded-full border-[1.5px] px-3 py-[7px] text-[11.5px] font-bold transition-colors ${
                      sel ? "border-green bg-green text-on-dark" : "border-border-strong bg-white text-ink-2"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <MicroLabel className="px-[18px] pb-1.5 pt-3.5 text-meta">
            Questions · {state.builderQs.length}
          </MicroLabel>
          <div className="flex flex-col gap-2 px-4">
            {state.builderQs.map((q, idx) => (
              <div key={q.id} className="rounded-input border border-border-soft bg-white px-[13px] py-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "builderEdit",
                        index: idx,
                        patch: { opts: Array.isArray(q.opts) ? null : ["Yes", "Mostly", "Not really", "No"] },
                      })
                    }
                    className="rounded-full bg-gold-chip px-2.5 py-1.5 text-[10px] font-bold text-gold-ink"
                  >
                    {Array.isArray(q.opts) ? `Choice · ${q.opts.length}` : "Free text"}
                  </button>
                  <button
                    onClick={() => dispatch({ type: "builderRemove", index: idx })}
                    aria-label={`Remove question: ${q.text}`}
                    className="ml-auto grid h-11 w-11 place-items-center rounded-full text-meta-faint"
                  >
                    <X size={15} aria-hidden />
                  </button>
                </div>
                <label htmlFor={`bq-${q.id}`} className="sr-only">
                  Question text
                </label>
                <input
                  id={`bq-${q.id}`}
                  value={q.text}
                  onChange={(e) => dispatch({ type: "builderEdit", index: idx, patch: { text: e.target.value } })}
                  className="mt-2 w-full rounded-[9px] border border-sand bg-[#FDFBF4] px-2.5 py-2 text-[13px] text-ink outline-none focus:border-green"
                />
                <p className="mt-1.5 text-[10.5px] text-meta">
                  {Array.isArray(q.opts) ? q.opts.join(" / ") : "Open response — optional"}
                </p>
              </div>
            ))}
            <button
              onClick={() => dispatch({ type: "builderAdd" })}
              className="rounded-input border-[1.5px] border-dashed border-[#C4BFAF] p-[11px] text-center text-[13px] font-bold text-meta-faint"
            >
              + Add question
            </button>
          </div>

          <div className="px-4 pb-1.5 pt-3.5">
            <button
              onClick={() => {
                if (!canLaunch) return;
                dispatch({ type: "launchSurvey", role, title, audience });
                setTitle("");
                setJustLaunched(true);
              }}
              aria-disabled={!canLaunch}
              className={`w-full rounded-[15px] py-3.5 text-center text-[14.5px] font-extrabold transition-colors ${
                canLaunch ? "bg-gold text-charcoal" : "bg-sand text-meta"
              }`}
            >
              {canLaunch ? "Launch survey →" : "Add a title and a question"}
            </button>
            <p className="px-2.5 pb-4 pt-2.5 text-center text-[11px] leading-relaxed text-meta">
              Anonymity thresholds apply automatically — results appear only above 20 voices.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
