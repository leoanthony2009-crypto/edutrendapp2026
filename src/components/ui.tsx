import { useEffect, useRef, type ReactNode } from "react";
import { themeColor } from "../data/questionBanks";

export function ThemeBadge({ theme, title }: { theme: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex flex-none items-center rounded-md px-2 py-1 font-body text-[10px] font-extrabold uppercase tracking-[0.06em] text-white"
      style={{ backgroundColor: themeColor(theme) }}
    >
      {theme}
    </span>
  );
}

export function MicroLabel({ children, className = "text-meta" }: { children: ReactNode; className?: string }) {
  return <div className={`micro-label ${className}`}>{children}</div>;
}

export function Meter({
  value,
  color = "#C8A951",
  track = "#F3EFE2",
  height = 9,
  label,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
  label?: string;
}) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label}
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: track }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

/**
 * Bottom sheet with dialog semantics, Escape-to-close and focus containment
 * (DESIGN_REVIEW.md P1-1 — the prototype's sheets were plain divs).
 */
export function Sheet({
  title,
  onClose,
  children,
  labelledBy,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>("input, textarea, button, [href]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && el) {
        const focusables = Array.from(
          el.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
        ).filter((n) => !n.hasAttribute("disabled"));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex items-end" role="presentation">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-charcoal/40"
        tabIndex={-1}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-labelledby={labelledBy}
        className="relative w-full rounded-t-[26px] bg-cream p-5 pb-7 animate-fadeUp"
        style={{ animationDuration: ".25s" }}
      >
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClose, dark = false }: { onClose: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className={`grid h-11 w-11 flex-none place-items-center rounded-full text-sm ${
        dark ? "bg-on-dark/15 text-on-dark" : "bg-sand text-meta-faint"
      }`}
    >
      ✕
    </button>
  );
}
