# Bloom — Implementation Notes

This repository now contains the **Bloom app** ("Your Voice Matters"): the EduTrend redesign
implemented per `README.md` (handoff brief), recreated from the design reference
`Bloom App.dc.html` in React 19 + TypeScript + Vite + Tailwind + Recharts + Lucide, honouring
`PASTORAL_PULSE_SPEC.md` (in `leoanthony2009-crypto/edutrend-and-Bloom`) and the remediation
backlog in `AUDIT_REPORT.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 24 unit tests (scoring, rotation, store/alerts, triage)
npm run build      # typecheck + production build (dist/)
```

The header/side-rail role chip cycles Student → Teacher → Leader (demo affordance — real roles
come from auth; see "What still needs a backend").

## What was built

All 13 screens from the design reference, pixel-faithful to its tokens (colors, Bricolage
Grotesque / Instrument Sans, radii, spacing, copy): Splash · Today ×3 roles · Pulse carousel
(choice + free-text, empty-bank and done states) · Question manager · Survey Builder
(locked/unlocked, launch, "Your surveys") · Trends (Recharts pulse line, domain/participation/theme
bars) · What's Hot · Micro-Learning Shot modal · National Report · Profile (+ Teacher Perks sheet) ·
Tell-a-leader sheet.

PWA shell: `manifest.webmanifest` + service worker (app-shell cache), local-first persistence in a
single versioned localStorage key behind one reducer (`src/lib/store.tsx`), Trends code-split so
first load is ~80 KB gzipped.

## Design-review defects corrected (DESIGN_REVIEW.md)

| # | Defect | Correction |
|---|---|---|
| P1-1 | `div onClick` everywhere | Every control is a semantic `<button>`/`<a>`/`<input>`/`<textarea>` with visible `:focus-visible`; sheets/modals are `role="dialog"` with focus trap + Escape |
| P1-2 | Metadata contrast | Metadata token darkened to `#6F6A58` (≥4.5:1 on cream); inactive nav darkened to `#847D66` |
| P1-3 | "Prefer not to say" scored | Excluded from scoring entirely; option list denominator shrinks (`src/lib/scoring.ts`, tested) |
| P1-4 | Single-line free text | `<textarea>` with min-height + character guide |
| P1-5 | No persistence | All state persists (answers, submissions per-day, custom questions, launched surveys, unlock counter, alerts, toggles) |
| P1-6 | Splash every launch | First launch only, ≤1s, `prefers-reduced-motion` short-circuits |
| P1-7 | Role chip = fake auth | Kept as labelled demo context switcher; real roles land with auth |
| P2-8 | Chart accessibility | `role="meter"` + labels on every bar; sr-only data summaries for line/spark/participation charts |
| P2-9 | Client-clock rotation | Seed isolated in `rotationSeed()` for a one-line server swap |
| P2-12 | Touch targets | Nav ≥48px, all icon buttons ≥44px |
| P3-15 | Glyph icons | Lucide icons in nav + UI; Bloom mark is a real SVG component (`BloomLogo`) |
| P3-16 | "Run again" | One pulse per day; same-day answers remain editable ("Change today's answers") |
| P3-17 | POUI GPT link | "Opens outside Bloom, in ChatGPT" hint + external-link icon |

## Audit remediations honoured (AUDIT_REPORT.md)

- **P1-1 (AI gating):** Champion escalation is **unconditional** for non-empty flagged free text;
  triage (`src/lib/triage.ts`, keyword heuristic) only annotates severity and defaults can never
  swallow an escalation. Tested in `store.test.ts`.
- **P1-2 (third-party AI):** no free text leaves the device in this build; the spec's Gemini
  classifier belongs server-side where the key can live.
- **T&T localization:** Forms/Standards terminology, T&T content, no UK residue.
- **Navigation:** global bottom bar (<768px) and side rail (≥768px) on every screen; two-column
  Today and wider Trends on desktop.

## What still needs a backend (launch blockers before any school pilot)

Everything below is architected for (single reducer write-path, isolated seeds, typed alert queue)
but **not resolved** by this frontend — see `AUDIT_REPORT.md` P0 list:

1. Authentication + server-side roles (the role chip must become auth-derived).
2. Server-persisted, append-only ChampionAlert queue with Champion delivery — alerts currently stay
   on-device, which is acceptable only for the demo.
3. Server-side pulse submission store feeding real Trends/Bridge/BSC rollups (today's history series
   are prototype fixtures blended with the device's own submissions).
4. Server-side rotation seed, Survey Builder unlock counter, and the 20-voice threshold.
5. Gemini triage + POUI micro-move generation via API routes per spec §4.3/§5.
