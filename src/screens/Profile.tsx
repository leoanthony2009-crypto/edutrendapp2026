import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useStore } from "../lib/store";
import type { Screen } from "../types";
import { PERKS, PROFILES, ROLE_CHIPS, SCHOOL_NAME } from "../data/insights";
import { CloseButton, Sheet } from "../components/ui";

export function Profile({ go }: { go: (s: Screen) => void }) {
  const { state, dispatch } = useStore();
  const role = state.role;
  const profile = PROFILES[role];
  const canEdit = role !== "student";
  const [perksOpen, setPerksOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const row =
    "flex w-full min-h-[52px] items-center justify-between rounded-2xl border border-border-soft bg-white px-[15px] py-3.5 text-left";

  return (
    <div className="md:mx-auto md:max-w-2xl">
      <div className="px-4 pt-4">
        <h2 className="font-display text-[26px] font-extrabold">Profile</h2>
        <p className="mt-1 text-xs text-meta">
          {SCHOOL_NAME} · {ROLE_CHIPS[role]}
        </p>
      </div>

      <div className="mx-4 mt-3.5 flex flex-col gap-[9px] pb-4">
        <div className="flex items-center gap-[11px] rounded-2xl border border-border-soft bg-white px-[15px] py-3.5">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green font-display text-[15px] font-extrabold text-gold-bright">
            {profile.init}
          </div>
          <div>
            <div className="text-sm font-bold">{profile.name}</div>
            <div className="text-[11.5px] text-meta">{profile.sub}</div>
          </div>
        </div>

        {canEdit && (
          <button onClick={() => go("manage")} className={row}>
            <span className="text-[13.5px] font-semibold">Carousel questions</span>
            <ChevronRight size={16} className="text-[#C4BFAF]" aria-hidden />
          </button>
        )}

        <button
          onClick={() => dispatch({ type: "toggleBridgeDigest" })}
          role="switch"
          aria-checked={state.bridgeDigest}
          className={row}
        >
          <span>
            <span className="block text-[13.5px] font-semibold">Friday Bridge digest</span>
            <span className="mt-0.5 block text-[11px] text-meta">A weekly read of what your week revealed</span>
          </span>
          <span
            aria-hidden
            className={`relative block h-[23px] w-10 flex-none rounded-full transition-colors ${
              state.bridgeDigest ? "bg-green" : "bg-[#D8D2C0]"
            }`}
          >
            <span
              className="absolute top-[2.5px] block h-[18px] w-[18px] rounded-full bg-white transition-all"
              style={{ left: state.bridgeDigest ? 19 : 3 }}
            />
          </span>
        </button>

        <div className="rounded-2xl border border-border-soft bg-white px-[15px] py-1">
          {[
            ["School type", "Secondary"],
            ["Board", "Catholic · CEBM"],
            ["Location", "Port of Spain"],
          ].map(([k, v], i) => (
            <div
              key={k}
              className={`flex items-center justify-between py-[11px] ${i < 2 ? "border-b border-cream-dim" : ""}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-meta">{k}</span>
              <span className="text-[12.5px] font-bold">{v}</span>
            </div>
          ))}
        </div>

        {canEdit && (
          <button
            onClick={() => setPerksOpen(true)}
            className="flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-gradient-to-br from-gold to-gold-bright px-[15px] py-3.5 text-left text-charcoal"
          >
            <span aria-hidden>✿</span>
            <span className="flex-1 text-sm font-extrabold">Teacher Perks</span>
            <span className="rounded-full bg-charcoal px-[9px] py-1 text-[10.5px] font-extrabold text-gold-bright">
              4 New
            </span>
          </button>
        )}

        <button
          onClick={() => setFeedbackSent((v) => !v)}
          className={row}
          aria-live="polite"
        >
          <span className="text-[13.5px] font-semibold">
            {feedbackSent ? "Feedback sent — thank you ✓" : "Send feedback"}
          </span>
          <ChevronRight size={16} className="text-[#C4BFAF]" aria-hidden />
        </button>

        <div className="rounded-2xl border border-border-soft bg-white px-[15px] py-3.5">
          <h3 className="text-[13.5px] font-semibold">Privacy</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-meta">
            Voices are anonymised. Free text signalling concern is read only by the school's Pastoral
            Champion within 24 hours. Pupils are referenced by handles, never names. Insights appear
            only above the 20-voice threshold.
          </p>
        </div>

        <p className="py-1.5 pb-4 text-center text-[10.5px] text-[#A8A18B]">
          Bloom · BLOOM Foundation · Trinidad &amp; Tobago · v2.0 · Every Child, Every Chance
        </p>
      </div>

      {perksOpen && (
        <Sheet title="Teacher Perks" onClose={() => setPerksOpen(false)}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold text-charcoal">Teacher Perks</h2>
            <CloseButton onClose={() => setPerksOpen(false)} />
          </div>
          <p className="mt-1 text-xs text-meta">Earned by your 12-day pulse streak · thank you for showing up</p>
          <div className="mt-3.5 flex flex-col gap-2">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-center gap-[11px] rounded-input border border-border-soft bg-white px-3.5 py-3">
                <span className="text-[15px] text-gold" aria-hidden>✿</span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">{p.title}</div>
                  <div className="mt-0.5 text-[11px] text-meta">{p.sub}</div>
                </div>
                <span className="rounded-full bg-gold-chip px-2 py-1 text-[9.5px] font-extrabold text-gold-ink">NEW</span>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
