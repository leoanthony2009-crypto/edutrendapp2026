import { useState } from "react";
import { Zap, ExternalLink } from "lucide-react";
import { HOT_CARDS, MICRO_SHOTS, NAT_REGIONS, POUI_GPT_URL, SCHOOL_NAME } from "../data/insights";
import { CloseButton, MicroLabel } from "../components/ui";

export function WhatsHot() {
  const [shotIdx, setShotIdx] = useState<number | null>(null);
  const [natOpen, setNatOpen] = useState(false);

  return (
    <div className="md:mx-auto md:max-w-3xl">
      <div className="px-4 pt-4">
        <h2 className="font-display text-[26px] font-extrabold tracking-tight">What's Emerging</h2>
        <p className="mt-1 text-xs text-meta">Signals across {SCHOOL_NAME} and the district</p>
      </div>

      <button
        onClick={() => setNatOpen(true)}
        className="mx-4 mt-3.5 flex w-[calc(100%-2rem)] items-center gap-[11px] rounded-2xl bg-charcoal p-3.5 text-left text-[#EFF3ED] on-dark"
      >
        <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold-bright/15 text-gold-bright">
          <Zap size={16} aria-hidden />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-bold">National Report</div>
          <div className="mt-0.5 text-[11px] text-[#AFC3B6]">Aggregated monthly insights · Trinidad &amp; Tobago</div>
        </div>
        <span className="rounded-full bg-gold-bright px-2 py-1 text-[10px] font-extrabold text-charcoal">NEW</span>
      </button>

      <div className="mx-4 mt-2.5 rounded-input border border-gold-tint-border bg-gold-tint px-3.5 py-[11px] text-[11.5px] leading-relaxed text-gold-ink">
        <b>Privacy shield.</b> Themes appear only when 20+ voices in a comparison group have responded.
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-4 pb-4 md:grid md:grid-cols-2 md:items-start">
        {HOT_CARDS.map((h, i) => (
          <article key={h.title} className="card p-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-meta">{h.cat}</span>
              <span className="text-[11px] font-extrabold" style={{ color: h.heatColor }}>
                {h.heat}
              </span>
            </div>
            <h3 className="mt-1.5 font-display text-[17px] font-bold">{h.title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B6F5F]">{h.body}</p>
            <div className="mt-2.5 h-1 rounded-full" style={{ background: h.bar }} aria-hidden />
            <p className="mt-2 text-[11px] text-meta">{h.why}</p>
            <button
              onClick={() => setShotIdx(i)}
              className="mt-2.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gold-tint-border bg-gold-chip px-3.5 py-[7px] text-[11.5px] font-extrabold text-charcoal"
            >
              <Zap size={12} className="text-gold" aria-hidden /> Micro-Learning Shot
            </button>
          </article>
        ))}
      </div>

      {shotIdx !== null && <ShotModal idx={shotIdx} onClose={() => setShotIdx(null)} />}
      {natOpen && <NationalReport onClose={() => setNatOpen(false)} />}
    </div>
  );
}

function ShotModal({ idx, onClose }: { idx: number; onClose: () => void }) {
  const shot = MICRO_SHOTS[idx];
  return (
    <div className="absolute inset-0 z-[44] flex items-center justify-center bg-charcoal/45 p-6" role="presentation">
      <button aria-label="Close" onClick={onClose} tabIndex={-1} className="absolute inset-0 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Micro-Learning Shot: ${shot.title}`}
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-[22px] bg-cream"
      >
        <div className="relative bg-gradient-to-br from-green-deep to-green p-[18px] pb-[26px] on-dark">
          <div className="absolute right-3 top-3">
            <CloseButton onClose={onClose} dark />
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-[13px] bg-cream text-gold shadow-md">
            <Zap size={20} aria-hidden />
          </div>
        </div>
        <div className="p-[18px] pt-3.5">
          <MicroLabel className="text-gold-ink">Micro-Learning Shot</MicroLabel>
          <h2 className="mt-1 font-display text-[21px] font-extrabold text-charcoal">{shot.title}</h2>
          <div className="card mt-3 rounded-input px-3.5 py-3">
            <div className="text-[11px] font-extrabold text-green">The concept</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{shot.concept}</p>
          </div>
          <div className="mt-2 rounded-input border border-gold-tint-border bg-gold-tint px-3.5 py-3">
            <div className="text-[11px] font-extrabold text-gold-ink">Try this tomorrow</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{shot.tryThis}</p>
          </div>
          <div className="card mt-2 rounded-input px-3.5 py-3">
            <div className="text-[11px] font-extrabold text-listening">Grounded in research</div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{shot.researchLocal}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{shot.researchWider}</p>
          </div>
          <div className="mt-3.5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-input bg-charcoal py-[13px] text-center text-sm font-extrabold text-on-dark"
            >
              Got it, thanks →
            </button>
            <a
              href={POUI_GPT_URL}
              target="_blank"
              rel="noreferrer"
              title="Opens outside Bloom, in ChatGPT"
              className="grid flex-none place-items-center rounded-input bg-gold-chip px-4 text-[12.5px] font-extrabold text-gold-ink no-underline"
            >
              <span className="inline-flex items-center gap-1">
                POUI GPT <ExternalLink size={11} aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function NationalReport({ onClose }: { onClose: () => void }) {
  const max = Math.max(...NAT_REGIONS.map((r) => r.v));
  return (
    <div
      className="absolute inset-0 z-[45] flex flex-col bg-cream"
      role="dialog"
      aria-modal="true"
      aria-label="National Report"
    >
      <div className="relative bg-charcoal p-[18px] text-[#EFF3ED] on-dark">
        <div className="absolute right-3.5 top-3.5">
          <CloseButton onClose={onClose} dark />
        </div>
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-gold-bright" aria-hidden />
          <h2 className="font-display text-[17px] font-extrabold">National Report</h2>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8FE3B0]">July 2026</div>
            <div className="mt-1 text-[11.5px] text-[#AFC3B6]">12,450 total participants</div>
          </div>
          <div className="text-right">
            <div className="font-display text-[22px] font-extrabold text-[#8FE3B0]">+15%</div>
            <div className="text-[9.5px] uppercase tracking-[0.1em] text-[#AFC3B6]">Participation</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-5">
        <div className="card rounded-2xl border-l-4 border-l-green p-3.5">
          <MicroLabel>National headline</MicroLabel>
          <p className="mt-1.5 text-sm italic leading-relaxed text-charcoal">
            "Secondary schools report 26% higher stress levels than Primary schools nationwide, driven
            largely by SBA deadlines and curriculum pacing."
          </p>
        </div>
        <div className="card mt-3 rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-bold">Regional data</h3>
            <span className="rounded-full bg-cream-dim px-2.5 py-1 text-[10.5px] font-bold text-meta">
              Responses by region
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-[9px]">
            {NAT_REGIONS.map((r) => (
              <div key={r.label} className="grid grid-cols-[56px_1fr_44px] items-center gap-2">
                <span className="text-right text-[11px] font-bold text-ink-2">{r.label}</span>
                <div
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={r.v}
                  aria-label={`${r.label}: ${r.v} responses`}
                  className="h-3 overflow-hidden rounded-[5px] bg-cream-dim"
                >
                  <div
                    className="h-full rounded-[5px]"
                    style={{
                      width: `${Math.round((r.v / max) * 100)}%`,
                      background: r.label === "Tobago" ? "#5BAA70" : "#295C4D",
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-meta">{(r.v / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-input border border-gold-tint-border bg-gold-tint px-3.5 py-[11px] text-[11.5px] leading-relaxed text-gold-ink">
          Aggregated across 42 schools. No school or individual is identifiable below the 20-voice
          threshold.
        </div>
      </div>
    </div>
  );
}
