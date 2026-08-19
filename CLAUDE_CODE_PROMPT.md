# CLAUDE CODE — BUILD PROMPT (greenfield)

Copy everything below the line into Claude Code as your first message, from the root of the `edutrendapp2026` repo.

---

You are the senior product designer + senior frontend engineer building **Bloom** ("Your Voice Matters") from scratch in this repository. There is no existing app code — scaffold it. The design and requirements are already in this repo:

- `README.md` — the full implementation spec: design tokens, all 13 screens, interactions, state, unlock logic. This is the source of truth for UI and behavior.
- `Bloom App.dc.html` — a working high-fidelity HTML design reference. Open it in a browser and interact with every flow (switch roles via the header chip). Recreate it, do not copy its code.
- `DESIGN_REVIEW.md` — known defects in the design reference, classified P1–P3. Correct every one of them in your implementation (keyboard access, contrast, "Prefer not to say" excluded from scoring, textareas for free text, persistence, splash on first launch only, roles from auth).
- `PASTORAL_PULSE_SPEC.md` — the data architecture: Synodal Marks, PulseQuestion/PulseResponse types, One Child entries, Champion alerts, POUI micro-moves, BSC rollups, Weekly Bridge. Implement its TypeScript types and localStorage-backed services as specified. (If this file is missing, ask me for it before modelling data.)
- `AUDIT_BRIEF.md` — skip the audit phase (nothing to audit yet); use its acceptance gate as your definition of done.

## Stack
Vite + React 19 + TypeScript + Tailwind CSS + Recharts + lucide-react. PWA with Service Worker and offline queueing. Local-first: all persistence through a storage layer over localStorage (backend can come later — design the API boundary so it can be swapped). No backend calls; where the spec names Gemini (free-text triage, POUI generation), implement the service interface with the curated fallback bank from the spec and leave the API call behind a clearly-marked adapter.

## Build order
1. Scaffold + Tailwind semantic tokens from README § Design Tokens (no scattered hex values).
2. Core components: BloomLogo (SVG), BloomSplash, AppShell, BottomNavigation, PageHeader, cards (Insight/Pulse/MicroMove/Watchlist/Theme), Sheet, buttons, StatusBadge, PrivacyIndicator, EmptyState, ErrorState, Skeleton.
3. Data layer per PASTORAL_PULSE_SPEC.md: question banks (student 12 / teacher 5 / leader 5), rotation (3–5/day + weekly reflection), scoring (positive-first, exclude "Prefer not to say"), pulsesCompleted counter, surveys, Champion alert queue.
4. Screens in this order: Pulse carousel → Today (teacher, student, leader) → Question manager → Survey Builder with 10-pulse unlock → Trends (Recharts) → What's Hot + Micro-Learning Shot modal + National Report → Profile + Teacher Perks + Tell-a-leader sheet.
5. States: loading skeletons, empty, error, success on every data surface.
6. Responsive: mobile-first 390px; thoughtful 768/1280/1440 layouts (side rail, two-column Today, wider Trends) — not a stretched phone UI.
7. Accessibility: WCAG 2.2 AA — semantic buttons/inputs, focus-visible states, keyboard navigation, aria labels, chart text alternatives, 44px touch targets, prefers-reduced-motion.

## Role model
Roles (student / teacher / leader) come from a simple local auth/role-select on first run (no real backend yet). Persist the chosen role; a context switcher is fine for demo, but architect role gating properly (students never see the manager, builder, watchlist or Champion surfaces).

## Definition of done (from AUDIT_BRIEF acceptance gate)
Zero P0s; primary journeys work end-to-end per role (open app → today → complete pulse → see it collate into Today + Trends → unlock/builder flow for teacher); WCAG AA on critical journeys; keyboard usable; responsive at 390/768/1280/1440; graceful error/loading/empty states; `npm run build` clean; no console errors; tests covering scoring, rotation, unlock counter, and the carousel journey.

When you believe you are finished: run the production build, run the tests, click through every route at 390px and 1280px, fix what you find, THEN give me a summary of what you built, tested, and anything left stubbed behind the API adapter.
