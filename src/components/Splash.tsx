import { useEffect } from "react";
import { BloomAnimated } from "./BloomLogo";

// First-launch-only splash, ≤1s of blocking (DESIGN_REVIEW.md P1-6 corrects
// the prototype's 2.4s every-launch splash). Reduced-motion users skip the
// animation via the global media query.
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(onDone, reduced ? 150 : 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cream">
      <BloomAnimated size={120} />
      <div
        className="mt-5 font-display text-[32px] font-extrabold text-green animate-fadeUp"
        style={{ animationDelay: ".45s" }}
      >
        Bloom
      </div>
      <div
        className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink animate-fadeUp"
        style={{ animationDelay: ".6s" }}
      >
        Your voice matters
      </div>
    </div>
  );
}
