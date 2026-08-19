import { useStore } from "../lib/store";
import type { Role, Screen } from "../types";
import { Meter } from "../components/ui";

// Survey Builder entry card on teacher/leader Today — unlock progress toward
// 10 completed pulses (server-side counter is the destination:
// DESIGN_REVIEW.md P2-11).
export function BuilderPromoCard({ role, go }: { role: Role; go: (s: Screen) => void }) {
  const { state } = useStore();
  const done = state.pulsesCompleted[role] ?? 0;
  const unlocked = done >= 10;
  const pct = Math.min(100, (done / 10) * 100);

  return (
    <button
      onClick={() => go("builder")}
      className="relative mx-4 mt-3 block w-[calc(100%-2rem)] overflow-hidden rounded-card bg-gradient-to-br from-green-deep to-green p-[15px] text-left text-on-dark on-dark md:mx-0 md:w-full"
    >
      <div className="absolute -bottom-4 -right-4 h-[90px] w-[90px] rounded-full bg-gold-bright/10" aria-hidden />
      <span className="rounded-md bg-gold-bright px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-charcoal">
        Survey Builder
      </span>
      <div className="mt-2 font-display text-lg font-extrabold">Launch your own survey</div>
      <p className="mt-1 text-xs leading-relaxed text-on-dark-dim">
        {unlocked
          ? "Turn your idea into a live pulse for your class or school. Results collate in Trends within 24 hours."
          : "Build and launch your own pulses. Unlocks after 10 completed pulses — keep answering."}
      </p>
      <div className="mt-2.5">
        <Meter
          value={pct}
          color="#E9B93B"
          track="rgba(243,239,226,.15)"
          height={6}
          label={`Survey Builder unlock progress: ${Math.min(10, done)} of 10 pulses completed`}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-on-dark-dim">
        <span>{unlocked ? "Unlocked ✓" : `${Math.min(10, done)} of 10 pulses completed`}</span>
        <span className="font-extrabold text-gold-bright">
          {unlocked ? "Open →" : `${Math.max(0, 10 - done)} to go`}
        </span>
      </div>
    </button>
  );
}
