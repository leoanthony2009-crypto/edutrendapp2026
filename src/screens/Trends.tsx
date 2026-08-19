import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useStore, dateKey } from "../lib/store";
import { series30, series7, seriesTerm } from "../lib/pulseSeries";
import { DOMAINS, SCHOOL_NAME, THEMES } from "../data/insights";
import { Meter } from "../components/ui";

type RangeKey = "7d" | "30d" | "term";

const RANGE_META: Record<RangeKey, { label: string; cap: string; start: string }> = {
  "7d": { label: "7 days", cap: "Last 7 school days", start: "Wed" },
  "30d": { label: "30 days", cap: "Last 30 days", start: "4 wks ago" },
  term: { label: "Term", cap: "Term 2 to date", start: "wk 1" },
};

const PART = [78, 82, 74, 80, 84, 79, 81];
const DAYS = ["W", "T", "F", "M", "T", "W", "Td"];

export function Trends() {
  const { state } = useStore();
  const [range, setRange] = useState<RangeKey>("7d");
  const submitted = state.submittedOn[state.role] === dateKey();

  const data = (range === "7d" ? series7 : range === "30d" ? series30 : seriesTerm)(state.todayAvg).map(
    (v, i) => ({ i, v })
  );
  const last = data[data.length - 1];
  const part = PART.map((v, i) => (i === 6 && submitted ? v + 5 : v));

  return (
    <div className="md:mx-auto md:max-w-3xl">
      <div className="px-4 pt-4">
        <h2 className="font-display text-[26px] font-extrabold tracking-tight">Trends</h2>
        <p className="mt-1 text-xs text-meta">Collated from {165 + (submitted ? 1 : 0)} pulse runs · {SCHOOL_NAME}</p>
      </div>

      <div role="tablist" aria-label="Time range" className="mx-4 mt-3.5 flex rounded-xl bg-sand p-[3px]">
        {(Object.keys(RANGE_META) as RangeKey[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={range === k}
            onClick={() => setRange(k)}
            className={`min-h-[38px] flex-1 rounded-[10px] text-[12.5px] font-bold transition-colors ${
              range === k ? "bg-white text-charcoal" : "text-meta"
            }`}
          >
            {RANGE_META[k].label}
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
        <div>
          <section className="card mx-4 mt-3 p-[15px] md:mx-0">
            <h3 className="text-sm font-semibold">Pastoral Pulse over time</h3>
            <p className="mt-0.5 text-[11px] text-meta">{RANGE_META[range].cap} · includes today's collated pulses</p>
            <div className="mt-2.5 h-[120px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 10 }}>
                  <YAxis domain={[40, 100]} hide />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#295C4D"
                    strokeWidth={2.5}
                    fill="rgba(200,169,81,.15)"
                    isAnimationActive={false}
                    dot={(p: { index?: number; cx?: number; cy?: number }) =>
                      p.index === last.i ? (
                        <circle key={p.index} cx={p.cx} cy={p.cy} r={4.5} fill="#C8A951" />
                      ) : (
                        <circle key={p.index} cx={p.cx} cy={p.cy} r={2.5} fill="#295C4D" />
                      )
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Text alternative for the chart (DESIGN_REVIEW.md P2-8 / WCAG 1.1.1) */}
            <p className="sr-only">
              Pastoral Pulse scores, {RANGE_META[range].cap}: {data.map((d) => d.v).join(", ")} out of 100. Today: {last.v}.
            </p>
            <div className="flex justify-between px-1 pt-0.5 text-[10px] text-meta">
              <span>{RANGE_META[range].start}</span>
              <span>today</span>
            </div>
          </section>

          <section className="card mx-4 mt-3 p-[15px] md:mx-0">
            <h3 className="text-sm font-semibold">Domain snapshot · this week</h3>
            <p className="mt-0.5 text-[11px] text-meta">The eight Bloom pastoral domains</p>
            <div className="mt-3 flex flex-col gap-[9px]">
              {DOMAINS.map((d) => {
                const color = d.v < 60 ? "#D9634E" : d.v < 68 ? "#C8A951" : "#5BAA70";
                const deltaColor = d.d > 0 ? "#417E52" : d.d < 0 ? "#B04A38" : "#6F6A58";
                const deltaText =
                  d.d > 0 ? `up ${d.d}` : d.d < 0 ? `down ${Math.abs(d.d)}` : "unchanged";
                return (
                  <div key={d.label} className="grid grid-cols-[118px_1fr_40px] items-center gap-2">
                    <span className="text-[11px] font-semibold text-ink-2">{d.label}</span>
                    <Meter value={d.v} color={color} label={`${d.label}: ${d.v} percent, ${deltaText} this week`} />
                    <span className="text-[11px] font-bold" style={{ color: deltaColor }} aria-hidden>
                      {d.d > 0 ? "▲" : d.d < 0 ? "▼" : "·"}
                      {Math.abs(d.d)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div>
          <section className="card mx-4 mt-3 p-[15px] md:mx-0">
            <h3 className="text-sm font-semibold">Voice participation</h3>
            <p className="mt-0.5 text-[11px] text-meta">Share of pupils completing the daily carousel</p>
            <div className="mt-3 flex h-16 items-end gap-1.5" aria-hidden>
              {part.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-[5px]"
                    style={{ height: `${v * 0.62}%`, background: i === 6 ? "#C8A951" : "#295C4D" }}
                  />
                  <span className="text-[9px] text-meta">{DAYS[i]}</span>
                </div>
              ))}
            </div>
            <p className="sr-only">
              Daily participation percentages this week: {part.map((v, i) => `${DAYS[i]} ${v}%`).join(", ")}.
            </p>
          </section>

          <section className="card mx-4 my-3 p-[15px] md:mx-0">
            <h3 className="text-sm font-semibold">Recurring themes</h3>
            <div className="mt-3 flex flex-col gap-2.5">
              {THEMES.map((t) => (
                <div key={t.label} className="grid grid-cols-[1fr_90px] items-center gap-2.5">
                  <div>
                    <div className="text-[13px] font-semibold">{t.label}</div>
                    <div className="text-[10.5px] text-meta">{t.sub}</div>
                  </div>
                  <Meter value={t.w} color={t.color} label={`${t.label}, strength ${t.w} percent`} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
