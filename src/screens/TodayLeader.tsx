import { useStore } from "../lib/store";
import type { Screen } from "../types";
import { SCHOOL_NAME, UNHEARD } from "../data/insights";
import { MicroLabel, Meter } from "../components/ui";
import { BuilderPromoCard } from "./BuilderPromo";

export function TodayLeader({ go }: { go: (s: Screen) => void }) {
  const { state } = useStore();
  const openAlerts = state.championAlerts.filter((a) => a.status === "open").length;

  return (
    <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
      <div>
        <div className="px-4 pt-4 md:px-0">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Leadership view</h2>
          <p className="mt-1 text-xs text-meta">{SCHOOL_NAME} · 612 pupils · 38 staff · updated 3:40 pm</p>
        </div>

        <section className="mx-4 mt-3.5 rounded-card bg-charcoal p-4 text-[#EFF3ED] on-dark md:mx-0">
          <MicroLabel className="text-gold-bright">Perception gap · Safety</MicroLabel>
          <div className="mt-2.5 flex gap-3.5">
            <div className="flex-1">
              <div className="font-display text-[26px] font-extrabold text-gold-bright">84%</div>
              <div className="text-[10.5px] text-[#AFC3B6]">staff believe pupils feel safe</div>
            </div>
            <div className="flex-1">
              <div className="font-display text-[26px] font-extrabold text-[#F0967F]">67%</div>
              <div className="text-[10.5px] text-[#AFC3B6]">pupils say they felt safe this week</div>
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-on-dark-dim">
            The gap is widest in Forms 2–3, around break times. Neither view is treated as
            automatically correct.
          </p>
        </section>

        <section className="card mx-4 mt-3 p-[15px] md:mx-0">
          <h3 className="text-sm font-semibold">Whose voice are we least likely to have heard?</h3>
          <div className="mt-2.5 flex flex-col gap-2">
            {UNHEARD.map((u) => (
              <div key={u.label} className="grid grid-cols-[1fr_80px_34px] items-center gap-2">
                <span className="text-[12.5px] font-semibold">{u.label}</span>
                <Meter value={u.pct} color={u.color} label={`${u.label}: ${u.pct} percent participation`} />
                <span className="text-[11px] font-bold text-meta-faint">{u.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-meta">Participation in this week's Voice carousel, by cohort</p>
        </section>

        <section className="mx-4 mt-3 rounded-card border border-[#DCD3E8] bg-white p-[15px] md:mx-0">
          <MicroLabel className="text-self-emptying">Worth noticing</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">
            Pupils saying "I don't want to come tomorrow" this week mostly also reported lessons not
            making sense — this looks like a learning-support signal, not (yet) a safety one.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1 text-[11px] font-semibold text-[#6E548D]">Attendance pull ↓</span>
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1 text-[11px] font-semibold text-[#6E548D]">+ Lessons unclear</span>
            <span className="rounded-full bg-cream-dim px-2.5 py-1 text-[11px] font-semibold text-meta">Form 3 · 20+ pupils</span>
          </div>
        </section>
      </div>

      <div>
        <section className="mx-4 mt-3 rounded-card bg-charcoal p-[15px] text-[#EFF3ED] on-dark md:mx-0 md:mt-4">
          <MicroLabel className="text-self-emptying">Champion watchlist</MicroLabel>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            <b>{3 + openAlerts} pupils</b> on the watchlist · {openAlerts ? `${openAlerts + 1} new` : "1 new"} this
            week · all acknowledged within 24h.
          </p>
        </section>

        <section className="mx-4 mt-3 rounded-card border border-gold-tint-border bg-gold-tint p-[15px] md:mx-0">
          <MicroLabel className="text-gold-ink">One small change to test tomorrow</MicroLabel>
          <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-[#4A4636]">
            "Open the library at first break for Forms 2–3 — the pulses point to break time as where
            safety dips."
          </p>
          <button
            onClick={() => go("pulse")}
            className="mt-2.5 inline-block rounded-[10px] bg-green px-3 py-2.5 text-[11.5px] font-bold text-on-dark"
          >
            Answer this week's Leader Pulse →
          </button>
        </section>

        <div className="mb-4">
          <BuilderPromoCard role="leader" go={go} />
        </div>
      </div>
    </div>
  );
}
