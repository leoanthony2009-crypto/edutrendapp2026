# Bloom v2 — Production Readiness Audit

**Date:** 2026-08-19 · **Commit audited:** `fa75acd` on `claude/bloom-app-scaffold-build-6smu3s`
**Method:** full source read; test/type/lint/build runs; real-Chromium runtime probes (axe-core WCAG 2.2 AA with contrast enabled, keyboard traces, storage inspection, role-bypass attempt, overflow sweeps at 320/390/768/1024/1280); traced UI → state → persistence for every claim. No code was modified for this audit.
**Sources:** `COUNCIL_FIXES.md` (uploaded 2026-08-19, now committed), `PASTORAL_PULSE_SPEC.md`, `README.md`, `DESIGN_REVIEW.md`, `AUDIT_BRIEF.md`. `COUNCIL_REVIEW.md` is referenced by COUNCIL_FIXES.md but exists nowhere in the repo, Google Drive, or Gmail — council intent is audited via COUNCIL_FIXES.md only (**UNVERIFIED** source coverage).

---

## Executive verdict: **ALPHA READY**

Bloom v2 is a coherent, well-built, locally-persisted demonstration. Every primary journey completes end-to-end on one device, the core scoring/rotation/safeguarding logic is real and unit-tested (68/68 passing), and the design system is faithful and consistent. It is **not** ready for a school because: (1) there is no server — every rule that matters (role authorization, anonymity thresholds, once-daily, the 24-hour safeguarding window) is enforced only in client code and localStorage, which a pupil can edit; (2) two of the four Council gates (survey results + POUI drafting; feedback loops) are not implemented at all; (3) real-browser WCAG testing reveals contrast and interaction failures the jsdom gate could not see; (4) a large share of the analytics surface is labeled-but-real-looking demo data.

- NOT READY — no: journeys work and core logic is genuine
- **ALPHA READY — yes: demonstrable end-to-end on one device, honest gaps documented**
- BETA READY — no: Gates 3 & 4 absent, WCAG failures on critical journeys
- SCHOOL PILOT READY — no: no backend, no real authentication, safeguarding data in plaintext localStorage
- PRODUCTION READY — no

## Scores

| Area | /10 | Basis |
|---|---|---|
| UX / usability | 7.5 | Calm, legible, two-minute contract holds; some dead-end promises (see False UI) |
| Accessibility | 6 | Strong semantics/keyboard/focus foundation; real-browser contrast + radiogroup arrow keys + live regions fail |
| Safeguarding | 5 | Local workflow genuinely works (queue → SLA sort → ack → structured close); no enforcement, no receipt to teacher, no audit trail, plaintext storage |
| Privacy | 3 | 20-voice threshold is copy only; safeguarding text readable in localStorage; claims exceed controls |
| Survey methodology | 3 | Builder is launch-only: no results, no lifecycle depth, no POUI drafting/guardrails |
| Functional completeness | 4.5 | FIX 1+2 substantially built; FIX 3, 4, most of 5 not started |
| Responsive design | 8.5 | Zero overflow at 320/390/768/1024/1280 incl. 240-char titles; side rail ≥768 |
| Design-system consistency | 8 | Semantic tokens, calm severity, Synodal colors semantic; ~10 magic hex values remain |
| Security | 4 | No secrets, no XSS vectors, deps clean — but authorization is client-only and storage is plaintext |
| Performance | 8.5 | 103 KB gz shell + lazy 104 KB Trends chunk; self-hosted subset fonts; no heavy assets |
| Code quality | 8.5 | Typed, strict, adapter boundaries, no TODO/FIXME/dead code; demo seeds clearly marked |
| Automated testing | 7 | 68 tests incl. scoring/rotation/champion/a11y gate; gate blind to contrast; no analytics/results tests |

---

## Council release gates

### Gate 1 — Champion workspace: **FAIL** (close; genuine core, missing required pieces)
Works end-to-end locally (verified in Chromium): Tell-a-leader → alert with 24 h `readByDeadline` → appears in `/champion` triaged by SLA remaining → Mark as read → close **requires** structured outcome (4 dispositions + mandatory note, empty note rejected) → persists across reload. Pattern detection (same handle, 2+ staff, 5 days) auto-alerts with dedup; watchlist (≥2 mentions across ≥3 days/14 d) with per-pupil Reviewed / Parent contact / Safeguarding actions. `src/services/champion.ts`, `src/screens/ChampionWorkspace.tsx`, 13 dedicated tests.
**Why it fails the gate as specified in COUNCIL_FIXES.md FIX 1:**
- Teacher-side read receipt ("Read by your Champion ✓" on teacher Today) — **NOT IMPLEMENTED**; the acceptance criterion explicitly requires it. The teacher-facing "within 24 hours" promise still has no visible fulfilment.
- `isChampion: true` flag on teacher/leader accounts + "Champion" nav item (shield icon) — **NOT IMPLEMENTED**; access is `role === 'leader'` with entry cards instead (`ChampionWorkspace.tsx:158`, `AppShell` nav unchanged).
- Spec state styling (gold border open / burgundy left border + "overdue read" label) — **PARTIAL**: overdue sorts to top and gets burgundy text, but no border treatments.
- Watchlist actions write to a side store (`watchlistActions`), not `status`+`championReadBy`+timestamp on the entries as specified.
- No audit history of status transitions; only latest state is kept.
- 24 h window is deadline math + display only — no notification, no escalation on breach, and nothing server-side prevents deletion (see P0-1).

### Gate 2 — WCAG 2.2 AA critical journeys: **FAIL** (foundation strong, four concrete blockers)
Passing: all interactive elements are real `button/a/input/textarea/select` (zero interactive divs found); full keyboard pulse completion verified in Chromium (Tab + Enter); `:focus-visible` ring global; textareas with char guides; 68-test axe gate in CI; reduced-motion collapses all animation; skip link; labeled landmarks; modals trap and restore focus; charts have aria summaries + a data table for the trend line.
Failing (all verified in real Chromium, evidence in findings): **(a)** 17 color-contrast violations across 10 routes (gold-on-white 2.27:1, white-on-mark badges 2.3–2.8:1, purple micro-labels 4.12:1, avatar 4.19:1, tab text on sand 4.33:1); **(b)** radiogroup arrow-key navigation absent (FIX 2 item 2) — ArrowDown does not move focus; **(c)** zero `aria-live`/`role="status"` regions on the pulse screen (FIX 2 item 7); **(d)** splash not skippable on tap (FIX 2 item 8); **(e)** sub-44 px touch targets: type chips 32 px, ✕ remove and survey controls 36 px (FIX 2 item 6); **(f)** a focusable element inside the `aria-hidden` Trends chart (axe `aria-hidden-focus`, serious). The jsdom gate runs with color-contrast disabled, so it cannot catch (a) — the gate itself needs a browser-level stage.

### Gate 3 — Survey results + POUI drafting: **FAIL** (not implemented)
No per-survey results page exists — launched survey rows are not tappable to anything (`SurveyBuilder.tsx` renders rows with pause/close/delete only). No response collection exists: a launched survey's count stays 0 forever; the only non-zero count (23) is a hardcoded seed (`AppStore.tsx` SEED_SURVEYS). No close date, draft state, tracker mode, year-group targeting, POUI drafting, or question-quality guardrails. The visible "Anonymity thresholds apply automatically… above 20 voices" line is enforced nowhere.

### Gate 4 — Feedback loop: **FAIL** (not implemented)
No "You said → We did" surface (student card "This week in your school" is a static string, `Today.tsx`), no "Log an action" for leaders, no Weekly Bridge screens. `src/services/bridge.ts` contains working leader/teacher digest composers operating on real rollups — **never imported by any screen**. The Profile "Friday Bridge digest" toggle persists a boolean that controls nothing.

---

## Product map

**Routes:** `/` → `/today` · `/pulse` · `/trends` · `/hot` · `/profile` · `/manage` · `/builder` · `/champion` · `*`→`/today`. All client-side (React Router); no server routes, no API endpoints (the Gemini adapter intentionally always throws → curated fallbacks).
**Roles:** `student | teacher | leader` chosen at local sign-in (`RoleSelect`); leader doubles as Pastoral Champion. No admin, no separate Champion role, no multi-school tenancy (SCHOOL_ID hardcoded).
**Data model:** TypeScript types per spec (`types/`); persistence = `bloom:v1:*` keys in localStorage via a swappable adapter (`services/storage.ts`); SW caches app shell only.
**Workflows:** pulse (rotation → drafts → collated score → run log), safeguarding (3 alert triggers → queue → ack/close), surveys (draft → launch → status only), analytics (demo aggregates + today's-score blend), bridge/BSC (services only, no UI).

### Role × capability matrix

| Capability | Student | Teacher | Leader | Notes |
|---|---|---|---|---|
| Today / Pulse / Trends / What's Hot / Profile | ✓ | ✓ | ✓ | Trends is identical school-wide data for all roles — students see staff-ish metrics; acceptable per README but worth a product decision |
| Question manager (`/manage`) | redirect ✓ | ✓ (own + pupil bank) | ✓ | Gating = client `Navigate`, verified |
| Survey Builder (`/builder`) | redirect ✓ | ✓ (10-pulse unlock) | ✓ | Unlock counter client-side, demo-seeded 9/12 |
| Champion workspace (`/champion`) | redirect ✓ | redirect ✓ | ✓ | **All gating is frontend-only — see P0-1** |
| Tell-a-leader | ✓ (via pulse free-text triage) | ✓ (sheet) | – | Student sheet entry absent — students reach Champion only via triggersChampion question free text (`s12`, weekly). The audit brief's student journey expects a student Tell-a-leader; **PARTIAL** |
| Edit pupil carousel | ✗ | ✓ | ✓ | Per README "editable by teacher/leader" |

**Excessive permissions:** none via UI. Via storage: everything (see P0-1, P0-2). **Missing permissions:** student has no direct Tell-a-leader entry point (P2-8).

---

## P0 findings (safety / security / launch blockers)

**P0-1 · Authorization is entirely client-side — a pupil can self-promote to Champion.**
requirement: role restrictions must not exist only in the frontend → **FAIL** → evidence: signed in as Student via the UI, then `localStorage.setItem('bloom:v1:account','{"role":"leader",…}')`, reloaded `/champion` → full Champion workspace rendered (Chromium probe, confirmed) → `store/AppStore.tsx` (account in storage), `ChampionWorkspace.tsx:158` (role check in render) → any pupil on any device can read/modify safeguarding alerts, watchlist, outcome notes → **P0** → fix: real authentication + server-side authorization before any school data exists; this is inherent to the local-first demo architecture and must be the first backend milestone (the storage adapter boundary makes this swap clean).

**P0-2 · Safeguarding content is stored in plaintext localStorage, readable by any user of the device.**
requirement: sensitive pupil information protected → **FAIL** → evidence: sent Tell-a-leader note "SENSITIVE-NOTE…"; `localStorage['bloom:v1:championAlerts']` contains it verbatim (probe confirmed); One Child `notedFor` text and Champion outcome notes likewise → `services/champion.ts` → on shared school devices (the realistic case) pupils can read disclosures and Champion notes → **P0** → fix: server-side storage with role-scoped access for all safeguarding data; never persist disclosure text client-side beyond the submit queue.

**P0-3 · The 24-hour Champion promise is UI copy plus arithmetic — nothing makes it happen.**
requirement: "verify whether the 24-hour response window is enforced technically" → **PARTIAL** → evidence: `readByDeadline` computed and displayed, overdue sorts first (`champion.ts triagedAlerts`, tested) — but no notification, no escalation on breach (council protocol Seat 1.2 expects breach notification), the Champion only sees alerts if they open the app, and the teacher never learns the note was read (missing read receipt, FIX 1 acceptance) → `champion.ts`, `TellALeaderSheet.tsx` → a disclosure can sit unread indefinitely while the pupil-facing UI has promised "a leader will read this within 24 hours" → **P0** → fix: server-side deadline job + breach escalation + teacher-visible "Read ✓" (FIX 1 spec).

## P1 findings (fix before school deployment)

**P1-1 · Real-browser WCAG contrast failures on critical journeys (17 nodes, 10 routes).**
Evidence (axe-core in Chromium, WCAG 2.2 AA tags; ratios computed): gold `#C8A951` text on white = **2.27:1** (`.text-bloom-gold` stats, What's-Hot heat labels); white on mark colors `#5BAA70`/`#C8A951` = **2.82 / 2.27:1** (ThemeBadge/MarkBadge, incl. on the pulse screen); purple `#8E6FB6` micro-labels = **4.12:1** on white, worse on charcoal; avatar gold-on-green = **4.19:1** at 15 px bold; inactive tab text on sand = **4.33:1**. Files: `components/ui.tsx` (badges), `Today.tsx`, `Trends.tsx`, `Profile.tsx`, `cards.tsx`, `WhatsHot.tsx`. Fix: darken badge backgrounds (spec suggests `#B99434`-class adjustments), use `ink-gold`/`ink` for on-light gold text, lift micro-label colors. **The a11y gate must add a browser-stage contrast run — jsdom axe cannot check this (documented blind spot in `src/test/a11y.test.tsx`).**

**P1-2 · Carousel radiogroup has no arrow-key support** (FIX 2 item 2 explicit). Probe: ArrowDown from first option leaves focus at index 0. `PulseCarousel.tsx`. Screen-reader/keyboard users get non-standard radio behavior (Tab-only). Fix: roving tabindex + Arrow key handlers.

**P1-3 · No live regions**: progress label, launched banner (`role="status"` exists here — the one pass), feedback confirmation, Champion-read confirmations lack `aria-live="polite"` (FIX 2 item 7). Probe: 0 live/status nodes on `/pulse`. `PulseCarousel.tsx`, `TellALeaderSheet.tsx`.

**P1-4 · Touch targets below 44 px**: type chips 32 px (`min-h-8`), ✕ remove / survey pause-close 36 px (`min-h-9`), watchlist chips 40 px (`min-h-10`). FIX 2 item 6. `QuestionManager.tsx`, `SurveyBuilder.tsx`, `ChampionWorkspace.tsx`.

**P1-5 · Splash is not skippable on tap** (FIX 2 item 8). Probe: click during splash → still visible. `BloomSplash.tsx`. (First-launch-only ✓, ≤1 s ✓, reduced-motion ✓.)

**P1-6 · Focusable content inside `aria-hidden` chart** — axe serious (`aria-hidden-focus`), Recharts renders a focusable node inside the hidden wrapper. `Trends.tsx` chart container.

**P1-7 · Privacy claims exceed implementation.** "Results appear only above 20 voices", "Themes appear only when 20+ voices…", "Anonymity thresholds apply automatically" — no threshold logic exists anywhere in `src/` (no suppression function, no n≥20 check). Currently harmless (data is demo), but the copy asserts a technical control that is absent; the moment real responses land this becomes a privacy defect. Fix: implement suppression in the (future) aggregation layer and keep the copy; or soften copy until then. Also: no small-cell/intersection suppression design exists yet for filters (none exist today) — must be designed server-side (council Seat 5.5).

**P1-8 · Gate 3 scope absent** (survey results page, response collection, close dates, tracker, POUI drafting + guardrails, year-group targeting) — see Gate 3. Survey "results" cannot be audited for correctness because they do not exist; the seeded "23 responses" is static.

**P1-9 · Gate 4 scope absent** (You-said→We-did, Log-an-action, Weekly Bridge screens); `bridge.ts` composers are dead code until wired. Teacher/student personal pulse history (FIX 5) also absent — runs are persisted (`bloom:v1:runs`) but no surface reads them historically.

**P1-10 · Once-daily rules are client-only and per-device.** Same-day resubmit replaces the run and the unlock counter is guarded (probe: double-click Finish → 1 run, counter +1 exactly — **PASS** client-side; tested in `unlock.test.tsx`). But a second device or cleared storage starts fresh, and nothing server-side exists to enforce participation integrity. Also the Pulse tab after submission re-opens the prefilled carousel rather than showing the done state until midnight with an explicit "Edit today's answers" (FIX 5 wording) — behaviorally equivalent for editing, but the "completed" state is not communicated on return. `PulseCarousel.tsx` (`finished` is component-local state).

## P2 findings (important beta improvements)

- **P2-1** Champion audit history: status transitions overwrite; no immutable log, no per-event timestamps beyond `closedAt`. Council Seat 1.5 expects an audit log. `champion.ts`.
- **P2-2** Champion ownership hardcoded (`CHAMPION_ID = 'champion-demo'`); no assignment model. `ChampionWorkspace.tsx`.
- **P2-3** Rotation is date-seeded (deterministic per date string — DESIGN_REVIEW P2.9 satisfied for same-day consistency) but the seed is device-local date; school-timezone config still needed server-side. `rotation.ts`.
- **P2-4** `notedFor` free text can carry identifying details; only name-pattern heuristics guard it (`looksLikeRealName` on handle + notedFor). Consider length + PII guidance + Champion-side redaction flow.
- **P2-5** Age-tiered `juniorText` variants (FIX 5) absent; single register question bank. `questionBanks.ts`.
- **P2-6** Micro-move outcome follow-up ("Did it help?") absent; Tried/Saved toggles persist but feed nothing. `Today.tsx`, `AppStore.tsx`.
- **P2-7** Voice-mode capability (spec §9 "keep — useful for accessibility") was lost in the greenfield rebuild. **NOT IMPLEMENTED.**
- **P2-8** Students have no direct Tell-a-leader entry (only the weekly free-text question routes to Champion). Audit brief's student journey lists it. `Today.tsx` (student).
- **P2-9** Permission-denied is a silent redirect — no "you don't have access" messaging. `QuestionManager.tsx`, `SurveyBuilder.tsx`, `ChampionWorkspace.tsx`.
- **P2-10** `useLoaded` simulates loading with a timer on every mount — honest for exercising skeletons, but real fetch lifecycles must replace it before API integration; as shipped it adds 350 ms artificial delay per screen. `hooks/useLoaded.ts`.
- **P2-11** Send feedback toggles a label with no destination; Teacher Perks "4 New" hardcoded; "updated 3:40 pm" hardcoded. False-affordance cluster in `Profile.tsx` / `Today.tsx`.
- **P2-12** jsdom a11y gate hole: color-contrast disabled by necessity; add a Playwright+axe CI stage (the audit's own script proves the approach).

## P3 findings (polish)

- Unicode "✓" glyphs inside button labels ("Tried ✓", sheet confirmation "✓") instead of icons; harmless but inconsistent with the Lucide standard (FIX 5 icons otherwise done).
- ~10 magic hex values outside tokens (`#FDFBF4` inputs, `#EAF4EC/#2F5E3F` live badge, `#4A4636` body ink, `#F1ECF7/#6E548D` chips, `#8FE3B0`, `#F0967F` in National Report/perception gap). Promote to `@theme`.
- `SurveyBuilder` launch success banner scrolls to top imperatively; fine, but focus should move to the banner for SR users.
- `Sheet` bottom-sheet lacks swipe-to-dismiss affordance (Esc/backdrop/Cancel exist).
- BSC export (`bscExport.ts`) is spec-complete but has no UI/download trigger and hardcoded school constants — currently unreachable code kept for the §7 contract.

---

## Role-by-role journey findings

**Student** — sign-in ✓ → Today hero → carousel (choice + weekly textarea, "Prefer not to say" offered on sensitive questions) → done state → hero thanks-state → Trends today-point blend. Refresh mid-run: drafts persist (date-keyed, stale-day drafts discarded — `AppStore.tsx Drafts`). Back nav ✓ (q1 Back → Today). Double submission guarded ✓. Malformed storage: `storage.get` try/catch falls back to defaults ✓. Network failure: N/A locally; SW serves shell offline ✓. Expired session: N/A (no sessions — see P0-1). Return another day: new rotation set ✓; **no history/você-said surface (P1-9)**. History feedback: streak is `6 + (submitted ? 1 : 0)` — partly hardcoded (**false UI**).

**Teacher** — pulse (scale + one-word + free-text with Mark badges) → One Child prompt with real-name rejection (probe: "Marcus" rejected, "073" accepted) → micro-move regenerates from run (fallback bank; triage keyword heuristic offline) → unlock 9→10 verified → builder launch ✓ → **no results, no personal history (P1-8/9)**. "Run again" correctly absent (DESIGN_REVIEW P3.16 ✓).

**Leader** — weekly pulse ✓ → perception gap card is **static demo math** (84/67 hardcoded; no calculation to verify — flagged under analytics) → no intervention→outcome comparison (needs 4a) → Bridge absent (P1-9) → Champion workspace journey **verified end-to-end** (ack → structured close → persistence → gating).

**Champion** — see Gate 1. Overdue tested via seeded 30 h-old alert → sorts first, labeled. Duplicate Tell-a-leader notes create separate alerts (no dedup — acceptable; each is a report). Alerts cannot silently disappear in normal use (append-only queue, status transitions only) — but anyone with the device can wipe localStorage (P0-2).

## Safeguarding findings (summary)
Receiver: role=leader on the same device only (no delivery). Timestamps ✓ (`triggeredAt`, `readByDeadline`, `closedAt`). Acknowledgement ✓. Owner: hardcoded (P2-2). Deadline ✓ / overdue display ✓ / escalation ✗ (P0-3). Reviewed/parent-contact/safeguarding states ✓ (alert outcomes + watchlist actions). Closure ✓ requires note ✓ (tested). Audit history ✗ (P2-1). Unauthorized retrieval: trivially possible via storage (P0-1/2). Notes never appear in `bscExport` output ✓ (checked: export carries watchlist pattern text per spec §7 — review whether `notedFor` fragments should be redacted from exports; recommend yes).

## Privacy / security findings (summary)
No secrets/API keys in source ✓ (grep). No `dangerouslySetInnerHTML`/`innerHTML` ✓; React escaping throughout; external links `rel="noreferrer"` ✓. Dependencies: npm reported 0 vulnerabilities. SW caches same-origin only ✓. Sensitive data collected: pulse answers, free-text (potential disclosures), One Child handle+notedFor, Champion notes — all plaintext local (P0-2). Data minimisation: good (handles not names, validator enforced). Cross-school isolation: single-tenant by construction; **UNVERIFIED/undesigned** for multi-school — must be a server-side design requirement (treat as P0 at that milestone). GDPR/legal: not assessable from code; flag for operational review (consent, retention, DSAR for safeguarding notes).

## Survey / analytics findings (summary)
"Prefer not to say": **PASS end-to-end within the implemented pipeline** — excluded at scoring (`scoring.ts`, index-safe over the scorable subset), excluded from rollup averages, never coerced to a number; 5 unit tests prove it, including denominators (`scoring.test.ts`). Sentinels: empty free text filtered; `neutral` questions never scored ✓. **However** the aggregate surfaces the pipeline feeds are demo constants, so contamination cannot yet occur — nor can correctness be demonstrated on real aggregates.
Trends/domains/participation/themes/regional/national/perception-gap: **static demo data** (`data/demoAggregates.ts`, clearly labeled in code, invisible to users — see False UI). Only the "today" trend point and sparkline blend the user's real collated score (`collatedToday` = mean of baseline 73 and run score — arbitrary but documented demo math). Perception-gap and trend calculations: **NOT IMPLEMENTED** as calculations; nothing to verify mathematically. Timezone/date boundaries: local-date keying, DST-safe via string dates ✓.

## Missing functionality (concise list)
Per-survey results page · survey response collection · close dates/draft/tracker/scheduling · year-group targeting · POUI question drafting + guardrails · You-said→We-did (+ leader Log-an-action) · Weekly Bridge screens · personal pulse history · teacher read receipts · Champion nav item + `isChampion` flag · student Tell-a-leader entry · junior language variants · micro-move outcome follow-up · voice mode · real auth/backend/multi-tenancy · anonymity-threshold enforcement · audit log.

## False / prototype UI (release-critical to resolve or label)
1. All Trends charts except the today point (demo constants presented as school data)
2. Perception gap 84%/67% + cohort bars (static)
3. "You + 164 / 165 voices / school average 71%" (fabricated counts)
4. What's Hot theme cards + heat (static), National Report (fully static)
5. Seeded survey "23 responses"; new surveys frozen at 0
6. "This week in your school" student note (static)
7. 20-voice anonymity claims (no enforcement — P1-7)
8. "A leader will read this within 24 hours" (no delivery/receipt — P0-3)
9. Streak "6 days" (seeded base), Teacher Perks "4 New", "updated 3:40 pm"
10. Send feedback (no destination); Friday Bridge toggle (controls nothing)
11. Demo-seeded unlock counters (9/12) and Champion queue/watchlist seeds (marked in code)

## Test coverage
Ran: vitest 68/68 ✓ · `tsc -b` clean ✓ · oxlint clean ✓ · `npm run build` clean ✓ · jsdom axe gate 29/29 ✓ (contrast-blind). Existing coverage: PNTS exclusion, scoring denominators, rotation determinism/Friday, unlock/once-daily, champion queue/SLA/close/pattern/watchlist, role gating, full journeys, a11y matrix.
**Missing vs the 15 recommended regression areas:** anonymity threshold (no code to test), small-group privacy, cross-school isolation (N/A yet), survey response + per-survey results (N/A yet), perception-gap calc, trend calc (N/A yet), browser-level contrast stage, arrow-key keyboard completion. Recommend adding the audit's Playwright probes (axe+keyboard+bypass) as a CI e2e stage.

## Recommended remediation sequence
1. **P1-1…P1-6** (accessibility blockers — small, local, unblock Gate 2; add browser axe stage)
2. **FIX 1 completion** (read receipt, isChampion flag + nav, entry-status writes, audit log) — unblocks Gate 1 client-side
3. **FIX 3** (results page + response simulation/persistence, lifecycle, POUI drafting + guardrails) — Gate 3
4. **FIX 4** (You-said→We-did + Bridge screens over existing `bridge.ts`) — Gate 4
5. **FIX 5 batch** (done-state until midnight, personal history, junior variants, follow-ups, receipts)
6. **Backend milestone** (auth, server authorization, safeguarding store + 24 h enforcement, anonymity suppression, multi-tenancy) — clears P0-1/2/3 and converts False UI into real data. Nothing school-facing before this.

## The 10 things that must be fixed before a real school uses Bloom
1. Server-side authentication and authorization (P0-1)
2. Safeguarding data out of plaintext localStorage into a role-scoped server store (P0-2)
3. Enforced 24 h read window: delivery, escalation on breach, teacher read receipt (P0-3)
4. Contrast fixes + browser-stage axe in CI (P1-1)
5. Arrow keys, live regions, 44 px targets, skippable splash (P1-2/3/4/5)
6. Real survey responses + per-survey results with n≥20 suppression actually enforced (P1-7/8)
7. Feedback loops: You-said→We-did and Weekly Bridge on real rollups (P1-9)
8. Replace demo aggregates with real calculation paths (or clearly label demo mode in-product)
9. Champion audit log + ownership model (P2-1/2)
10. Multi-device once-daily + school-timezone rotation server-side (P1-10/P2-3)

## What is already strong — do not redesign
- **The calm severity language and visual system**: cream/green/gold, no red alarms, quiet burgundy safeguarding link, "Worth noticing" phrasing — exactly per council intent; preserve verbatim.
- **The two-minute contract**: one question per screen, giant targets, 4–5 rotated questions; verified fast.
- **Scoring and rotation logic**: positive-first with PNTS exclusion is correct and well-tested; date-seeded deterministic rotation is the right shape for a server seed.
- **The storage adapter + Gemini adapter boundaries**: services are cleanly swappable for the backend milestone; triage/POUI fallback banks are genuinely good offline behavior.
- **Champion workspace interaction design**: SLA-first triage, structured outcomes, no-improvement-framing footer — matches council Seat 4; needs completion, not rework.
- **Semantic component library** (real buttons, focus rings, dialogs with focus trap, labeled progress bars) and the token system.
- **Unlock mechanic, splash choreography (first-launch-only), Poui mark, and the overall README fidelity** — the design reference is faithfully recreated.
- **Test discipline**: the jsdom a11y gate pattern is right; it needs a browser stage added, not replacement.

---
*Audit complete. No application code was changed. Awaiting approval before any remediation.*
