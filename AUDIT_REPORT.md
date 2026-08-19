# EduTrend / Bloom — Production Readiness Audit Report

**Date:** 2026-08-19
**Audited codebase:** `leoanthony2009-crypto/edutrendtt` — the current EduTrend/BLOOM application ("BLOOM — Pastoral Platform", Next.js 14). The application source ships inside `edutrendttapp.zip` at the repo root (`bloom-app/`); the referenced handoff repo `edutrend-and-Bloom` contains only specification documents (`PASTORAL_PULSE_SPEC.md`, `CLAUDE_CODE_PROMPTS.md`) and no code.
**Method:** the app was installed, built, type-checked, linted and its test suite run; all 12 routes were exercised in a real browser (Chromium via Playwright) at 390 / 768 / 1280 px; the survey, consent, pulse and reports journeys were driven end-to-end; every API route and the storage/triage/alert services were read and probed with crafted requests.

---

## 1. Executive readiness assessment

The audited build is a **well-crafted single-device demo of a genuinely thoughtful design, presented as a multi-role school platform it is not yet able to be**. The survey pipeline (consent registry → allow-listed anonymous submission → k-anonymity-suppressed aggregate reports) is real, server-enforced, and passed every adversarial probe run in this audit. Almost everything else that makes the product a *platform* — authentication, cross-device data flow, the Champion safeguarding loop, pulse aggregation, deployability from the committed repo — is absent or simulated in browser localStorage.

Three findings are individually launch-blocking; together they mean **no school should be onboarded on this build**:

1. the safeguarding/Champion alert pipeline never leaves the reporting teacher's own browser;
2. there is no authentication or authorization of any kind;
3. the committed repository does not contain the application source and cannot be built or deployed from git.

The codebase is nevertheless a strong foundation: typed end-to-end, 40 passing unit tests over the governance-critical services, versioned survey instruments, and honest in-repo audit documentation (`docs/AUDIT.md`) that already acknowledges most structural gaps.

**Overall readiness score: 44 / 100 — verdict: NOT READY** (suitable for a facilitated single-device demo only; see § 12).

| Dimension | Score /10 | Basis |
|---|---|---|
| UX | 6 | Calm, well-written flows; but no global navigation, an Excel-upload dead end as the landing page, and demo role gates |
| Accessibility | 7 | Survey screens are genuinely good (labels, radiogroups, skip link, visible focus, ≥44 px targets); landmark and chart-alternative gaps elsewhere |
| Visual consistency | 5 | Two unrelated design systems coexist (UK-era "ink/lavender/Playfair" dashboard vs. Bloom survey chrome); glyph characters as icons |
| Functionality | 4 | Survey pipeline works end-to-end; pulse, watchlist, alerts and Bridge are single-device localStorage simulations |
| Responsiveness | 7 | No horizontal overflow at 390/768/1280 on any audited route; isolated sub-44 px targets |
| Performance | 7 | 204 KB first-load JS on the heaviest route, static prerender, no measured budget or enforcement |
| Security | 2 | No auth anywhere; public aggregate/consent endpoints; safeguarding data in localStorage; known-vulnerable dependencies |
| Maintainability | 6 | Typed, service-level tests, versioned instruments, good docs — but source-in-a-zip, no lint config, no CI |

---

## 2. Verified strengths (evidence, not theory)

These passed active probing and should be preserved through any redesign:

- **Consent gating is server-enforced.** `POST /api/surveys/submit` for the pupil instrument without a token → `403 consent_required`. Tokens are issued only after both affirmations, expire in 10 h, and are recorded append-only (`src/lib/surveyStore.ts:100-130`).
- **Answer allow-listing works.** A submission carrying `"studentName": "Jack Smith"` was stored as `{"answers":{"open_message":"hello"}}` — the injected identifying key was stripped (`src/app/api/surveys/submit/route.ts`, verified in `data/surveys/demo.responses.jsonl`).
- **k-anonymity suppression works.** `GET /api/surveys/report` with n=1 returned `"suppressed": true, "items": []` — no per-item data leaks below the threshold of 10 (`src/lib/surveyReport.ts`).
- **Demo seeding is production-gated.** `POST /api/surveys/seed` under `next start` → `403 seed_disabled_in_production`; the reports page surfaces a correct explanatory error (`src/app/reports/page.tsx:84`).
- **Offline outbox exists for surveys.** Failed submissions queue to `surveys:outbox` and are flushed idempotently when `/surveys` next loads (`SurveyRunner.tsx:88-95`, `surveys/page.tsx:22-40`).
- **Survey accessibility is above par**: skip-to-content link, labelled `select`/`input`/`textarea`, `role="radiogroup"`/`role="radio"` with `aria-checked`, `role="alert"` on errors, visible focus outlines (verified by keyboard walk), 44–48 px touch targets.
- **Quality gates pass**: `next build` clean, `tsc --noEmit` clean, 40/40 vitest tests green, ESLint (once installed) reports a single warning.

---

## 3. P0 — Critical launch blockers

### P0-1 · Safeguarding / Champion alerts never reach the Champion
- **Where:** `src/lib/pulseStorage.ts:7,25` (`championAlerts:{schoolId}` in `window.localStorage`); alert creation in `src/app/pulse/page.tsx:305-322` and `src/components/SafeguardingModal.tsx:34`; consumption in `src/app/champion/watchlist/page.tsx`.
- **Evidence:** completing a Daily Pulse in the audit browser produced `championAlerts:demo` in that browser's localStorage only. No API route writes or reads alerts. A Champion opening the watchlist on any other device sees nothing.
- **Impact:** a teacher who flags a child-safety concern reasonably believes "a leader will read this within 24 hours". Nobody will. This is the worst failure class an app in this domain can have.
- **Correction:** server-persisted, append-only ChampionAlert queue (per `PASTORAL_PULSE_SPEC.md`), delivered to authenticated Champions, with delivery/read receipts. This must precede any school pilot.

### P0-2 · No authentication or authorization anywhere
- **Where:** every route. `/reports`, `/champion/watchlist`, `/dashboard/bridge` gate on client-side buttons literally labelled "I am the Champion" / "I am the Principal / SLT" with the on-screen caveat "(Demo: this would be enforced by your auth provider in production)". All API routes are anonymous: `GET /api/surveys/report` and `/api/surveys/export` return leadership-only aggregates to anyone; `POST /api/surveys/consent` mints valid pupil-session consent tokens for any caller (verified by curl).
- **Impact:** aggregate wellbeing data for a school is world-readable; the consent control is real on the server but meaningless without an authenticated staff identity behind it; any visitor can pollute the dataset via unauthenticated submissions.
- **Correction:** real auth (the spec names Supabase Auth + RLS as destination architecture), server-side role checks on every read/write, and consent issuance restricted to authenticated staff.

### P0-3 · The committed repository does not contain the application
- **Where:** `edutrendtt@HEAD` contains 15 files: configs, lockfile, `netlify.toml` — and `edutrendttapp.zip`. There is no `src/` in git; `npm run build` from a fresh clone fails. Netlify (per `netlify.toml`) would build nothing.
- **Impact:** the deployed artifact cannot be reproduced, reviewed, or fixed from version control; no diffable history for a codebase handling child-wellbeing data.
- **Correction:** commit the extracted `bloom-app/` source as the repo root, delete the zip, and add CI that builds + tests on every push.

### P0-4 · Pulse data is single-device; Trends/insight surfaces cannot exist
- **Where:** `pulse:submissions:{schoolId}`, durations, One Child entries, watchlist actions, Bridge state — all localStorage (`src/lib/pulseStorage.ts`, `src/lib/watchlist.ts`, `src/lib/teacherIdentity.ts`).
- **Evidence:** the completed pulse journey wrote 5 localStorage keys and made no persisting network call (the only POST, `/api/pulse-followup`, is stateless triage/micro-move generation).
- **Impact:** the product's core promise — collated staff-wide pulse insight for teachers and leaders — is structurally impossible: every device sees only its own data. Weekly Bridge and BSC rollups aggregate an n of 1.
- **Correction:** server-side pulse submission store keyed by school + role, feeding trends, Bridge and BSC rollups; localStorage demoted to offline cache/queue.

---

## 4. P1 — High (fix before launch)

1. **AI triage gates safeguarding escalation, and fails silent.** `triageFreeText` (`src/services/triage.ts`) returns `"routine"` when `GEMINI_API_KEY` is absent, on any API error, and on any unexpected response — so a free-text answer describing an unsafe child creates **no alert** in every failure mode; when the API does work, Gemini alone decides what escalates (`pulse/page.tsx:305-308`). This violates the project's own constitution ("Human-led safeguarding", `docs/AUDIT.md` § P1). Free-text should reach the Champion unconditionally, with AI at most annotating priority; failure modes must escalate, not swallow. The raw remark is also interpolated unsanitised into the prompt (`triage.ts:31`) — classic prompt-injection surface.
2. **Teacher free-text is sent to a third-party AI processor** (Google Gemini) without consent copy, DPA reference, or redaction (`triage.ts`, `poui.ts`) — a data-protection exposure flagged in `docs/AUDIT.md` and unremediated.
3. **No global navigation.** Only `/dashboard` has a nav (its own sidebar). `/surveys`, `/pulse`, `/reports`, `/champion/watchlist`, `/me/bridge` are mutually unreachable except by typing URLs. Playwright confirmed: 0 `<nav>` landmarks on `/`, `/dashboard`*, `/reports`, `/champion/watchlist`, `/dashboard/bridge` (*dashboard's sidebar is divs).
4. **The landing page is a dead end for every role except a data-holding principal.** `/` demands an Excel upload (or "Load UK Demo") with no path to surveys, pulse, or reports. Teachers and Champions have no entry point.
5. **Localization drift — the app is half UK, half T&T.** Root metadata: "Leadership intelligence dashboard for **UK** Catholic school principals" (`layout.tsx`); One Child year groups are `EYFS, Y1…Y11` (`OneChildEntry.tsx:12`) while pupil consent uses T&T `Standard 2–5`; the demo school is "St. Thomas More Catholic Academy" with UK-styled data; the dashboard button says "Load **UK** Demo".
6. **Two unrelated design systems.** The dashboard (`ink`/`lav`/gold, Playfair Display, glyph icons `◉ ◈ ◇ ◆ ◎ ▣`) vs. the Bloom survey chrome. No shared component library; buttons, cards and headings are one-off per surface (`tailwind.config.js` mixes both palettes).
7. **Charts and sparklines have no text alternative.** Recharts dashboards (`SchoolOverview.tsx`, `PastoralLoad.tsx`, `ClassStability.tsx`, `LeadershipIntel.tsx`, `PrincipalReport.tsx`) expose no `aria-label` summaries or data tables (WCAG 1.1.1).
8. **Missing landmarks/headings on non-survey pages.** `/`, `/reports`, `/champion/watchlist`, `/dashboard/bridge` have no `<main>`/`<header>`/`<nav>` (verified). Survey pages have them; consistency is required for screen-reader navigation (WCAG 1.3.1/2.4.1).
9. **Default Next.js 404** ("404: This page could not be found") with no route back — off-brand and a dead end (verified at `/nonexistent`).
10. **Dependency vulnerabilities in production deps**: `npm audit --omit=dev` reports **high** advisories against `next@14.2.29` (SSRF in middleware redirects, cache-key confusion, DoS) and `nanoid`, plus `xlsx` (prototype pollution / ReDoS history; parses principal-uploaded files in the browser). Upgrade Next to a patched line and pin a maintained `xlsx` fork or parse server-side with limits.
11. **No CI, no committed lint config.** `npm run lint` drops into interactive setup (no `.eslintrc*` in the repo); nothing runs tests on push.
12. **No automated coverage of any UI journey.** The 40 tests cover services/instruments only; zero component or E2E tests for consent → survey → report, pulse, or watchlist.
13. **Non-OK submissions are reported as "saved offline".** `SurveyRunner.tsx:82-95`: any non-`res.ok` response (e.g. validation 400) falls through to the outbox and tells the user their voice was saved; the queued item can never succeed. Distinguish rejection from network failure.

---

## 5. P2 — Medium

1. **Consent-session UX trap:** after the class token expires (10 h) or on server restart with memory fallback, pupil submissions 403 mid-class with a generic "check the connection" message (`pupil/page.tsx:65`) — surface token state to the administering teacher.
2. **`schoolId` is client-supplied everywhere** (`getCurrentSchoolId()` from localStorage, default `"demo"`); any client can read/write any school's namespace once real multi-school data exists. Must derive from authenticated identity.
3. **Pulse "1:59" countdown** (`PulseTimingBanner`) has no `aria-live` and updates every second — noisy for screen readers; also implies a time limit that doesn't exist (anxiety-inducing framing).
4. **Term context and rotation are client-clock based** (`termContext()` in `pulse/page.tsx:334`, date-keyed pulse storage) — device clock skew changes school-level semantics; compute server-side.
5. **Isolated sub-44 px touch targets**: the pulse info toggle and `/me/bridge` back/Generate controls measured < 32 px in at least one dimension (Playwright box measurement).
6. **`/admin/bsc-preview` is linked from nothing and unprotected** — admin surface reachable by URL guessing (compounds P0-2).
7. **External font dependency with no fallback strategy**: Google Fonts `<link>` in `layout.tsx` (flagged by Next lint); on the audit network the request failed and pages rendered in system fonts — fine visually, but for a low-bandwidth T&T deployment fonts should be self-hosted (`next/font`).
8. **Report/export endpoints return `n` even when suppressed** — count disclosure below threshold is a deliberate design choice but worth a council decision record.
9. **`docs/` claims drift**: `CLAUDE.md`/docs reference a PWA shell, service worker and offline queueing — none exist in this build (`public/` holds three SVGs; no manifest, no SW). Claims and code must converge (the redesign brief inherits this false premise).
10. **In-memory fallback store silently loses data** on read-only hosts (`surveyStore.ts` memory fallback) — acceptable for demo, but there is no operator-visible signal that persistence is degraded.

---

## 6. P3 — Low

1. Glyph characters (`◉ ◈ ◇ ◆ ◎ ▣ ✿`) as nav/section icons — replace with a real icon set (Lucide per the redesign).
2. Dashboard greeting hardcodes persona details ("Good afternoon, Donovan.") derived from demo data paths.
3. `<title>` is identical on every route; per-page titles would aid tabs/history/screen readers.
4. Seed button visible on production `/reports` (its failure is handled well, but it invites a dead click).
5. `console` noise: one 404'd asset request on `/` (missing favicon).

---

## 7. Page-by-page findings

| Route | Works? | Key issues |
|---|---|---|
| `/` → `/dashboard` | ✅ renders; demo loads | Excel-only entry (P1-4); UK demo/branding (P1-5); no landmarks/nav (P1-8); charts unlabelled (P1-7) |
| `/surveys` | ✅ | Hub is clear and warm; only reachable by URL (P1-3) |
| `/surveys/pupil` | ✅ end-to-end (verified) | Best screens in the app; consent expiry UX (P2-1) |
| `/surveys/parent`, `/surveys/staff` | ✅ | Same strong pattern; no issues beyond global ones |
| `/reports` | ✅ suppression verified | Client-side role gate (P0-2); export links public (P0-2) |
| `/pulse` | ✅ submits, micro-move returned | Data device-local (P0-4); AI-gated alerts (P1-1); countdown (P2-3) |
| `/champion/watchlist` | ⚠️ renders | Shows only same-device data (P0-1); "I am the Champion" gate (P0-2) |
| `/dashboard/bridge`, `/me/bridge` | ⚠️ renders | Same auth + single-device limits; empty state copy is good |
| `/admin/bsc-preview` | ✅ | Unprotected admin surface (P2-6) |
| `/nonexistent` | ⚠️ | Default Next 404 (P1-9) |

## 8. Role journeys

- **Student (pupil):** consent gate → assent → survey → thank-you: **passes end-to-end** (browser-verified, including required-field blocking on each step). No account, by design.
- **Teacher:** Daily Pulse → micro-move "Read": passes on one device; collation, Bridge and alerting **fail structurally** (P0-1/P0-4). No login exists (P0-2).
- **Leader/Champion:** watchlist/Bridge/reports render but see honor-system gates and same-device data only: **fails** (P0-1/2/4).
- **Logout/login persistence:** not testable — no auth exists.

## 9. Missing automated tests (priority order)

1. E2E: consent → pupil survey → report suppression boundary (n=9 vs n=10).
2. E2E: pulse submission → Champion alert visible to a *different* session (will fail until P0-1 is fixed — write it first as the acceptance test).
3. API: authz matrix per role per endpoint (after P0-2).
4. Component: SurveyRunner validation, offline outbox, non-OK vs network-fail paths (P1-13).
5. Triage: failure-mode escalation contract (P1-1) — "API down ⇒ alert still raised".
6. Visual/a11y smoke: landmarks + axe pass per route at 390/1280.

## 10. Prioritized remediation backlog

| # | Item | Sev | Effort |
|---|---|---|---|
| 1 | Commit real source to git; delete zip; add CI (build+test+lint) | P0-3 | S |
| 2 | Server-side ChampionAlert queue, append-only, with read-deadline surfacing | P0-1 | M |
| 3 | Authentication + server-side role authorization on every page/API | P0-2 | L |
| 4 | Server-side pulse submission store; trends/Bridge/BSC read from it | P0-4 | M |
| 5 | Unconditional free-text escalation; AI annotates only; fail-loud | P1-1 | S |
| 6 | Global navigation + role-aware entry point replacing Excel-first landing | P1-3/4 | M |
| 7 | T&T localization pass (year groups, metadata, demo data) | P1-5 | S |
| 8 | Unify design system (single token set, shared components, real icons) | P1-6 | M→ redesign |
| 9 | Chart text alternatives + landmark/heading pass + branded 404 | P1-7/8/9 | S |
| 10 | Dependency upgrades (Next patched line, xlsx strategy) | P1-10 | S |
| 11 | Rejection vs offline distinction in SurveyRunner | P1-13 | S |
| 12 | E2E + component test suite per § 9 | P1-12 | M |
| 13 | P2 list (schoolId from identity, consent-expiry UX, countdown a11y, self-hosted fonts, admin gate) | P2 | M |

## 11. Acceptance-gate status

| Gate | Status |
|---|---|
| Zero P0 issues | ❌ 4 open |
| No unresolved serious authz/security failures | ❌ (P0-2, P1-1/2) |
| No broken primary workflows | ❌ Champion/insight loop broken (P0-1/4); survey loop ✅ |
| WCAG 2.2 AA on critical journeys | ⚠️ survey journey close; dashboard/landmark/chart gaps |
| Usable keyboard navigation | ✅ verified on audited flows |
| Responsive at 390/768/1280/1440 | ✅ no overflow found |
| Graceful error/loading/empty states | ⚠️ good empty states; error states partial (P1-13, P2-1) |
| Automated coverage of critical functionality | ❌ services only |
| No console/runtime errors in primary workflows | ⚠️ one 404 asset; external-font failures handled |

## 12. Final verdict

**NOT READY** for production. With P0-3 fixed (source in git) it is **ALPHA READY** for facilitated, single-device demonstrations with synthetic data only. Beta requires backlog items 1–5; production additionally requires 6–12 and a data-protection review of the AI processing path.

The Bloom redesign (`README.md` in this folder) should be implemented **on top of** this remediation order, not instead of it: its brief already presumes server-side pulse counters, a ChampionAlert queue and real roles — exactly the P0 list above. The design-side defects catalogued in `DESIGN_REVIEW.md` (P1 1–7 there) are corrected in the implementation that accompanies this report.
