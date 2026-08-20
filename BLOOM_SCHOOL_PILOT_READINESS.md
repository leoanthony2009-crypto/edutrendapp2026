# Bloom v2.1 — School Pilot Readiness (final acceptance audit)

**Date:** 2026-08-19 · **Branch:** `claude/bloom-app-scaffold-build-6smu3s`
**Predecessor:** `BLOOM_PRODUCTION_READINESS_AUDIT.md` (verdict ALPHA READY, 3× P0, all four gates FAIL)
**Method:** re-audited from scratch, not from the implementation plan. Every claim was re-verified at runtime: real Chromium probes (axe-core WCAG 2.2 AA **with contrast**, keyboard traces, client-tampering and cross-school ID attacks, browser-storage inspection, multi-device once-daily, console/overflow sweep across 4 viewports × 4 accounts × all routes), live API probes against a running server, and full test/type/lint/build runs. Findings below cite what was observed, not what was written.

---

## Executive verdict: **SCHOOL PILOT READY**

Zero P0 findings remain. All four Council gates PASS. Authentication, authorization, school tenancy, the 20-voice anonymity threshold, the 24-hour safeguarding SLA and once-daily participation are enforced server-side and proven by adversarial tests. Safeguarding disclosures no longer touch browser storage. Every school-facing number is computed from persisted responses or explicitly suppressed; the small amount of remaining editorial content is visibly labelled **Sample**.

This verdict covers **software readiness for a supervised pilot**. It is not a safeguarding-policy, data-protection or legal sign-off — see *Human sign-off still required*.

- NOT READY — no
- ALPHA READY — surpassed
- BETA READY — surpassed
- **SCHOOL PILOT READY — yes**
- PRODUCTION READY — no (deployment hardening, monitoring and governance work outstanding; cannot be awarded from code review)

## Scores

| Area | Before | Now | Basis for the change |
|---|---|---|---|
| UX / usability | 7.5 | 8.5 | Dead-end promises removed; real results, receipts, feedback loop |
| Accessibility | 6 | 9 | 26 browser tests incl. contrast on 16 routes, arrow-key radiogroups, live regions, 44px targets |
| Safeguarding | 5 | 9 | Server records, assignment, immutable audit, SLA sweep + escalation, teacher receipts |
| Privacy | 3 | 8.5 | K=20 enforced in the data layer with complement protection; disclosures off-device |
| Survey methodology | 3 | 8.5 | Full lifecycle + real results + POUI guardrails (advisory, never blocking) |
| Functional completeness | 4.5 | 9 | FIX 1–5 delivered; Gates 1–4 pass |
| Responsive design | 8.5 | 9 | Zero overflow at 320/390/768/1280 after the `sr-only` table fix |
| Design-system consistency | 8 | 8.5 | Deep token variants; calm severity and Synodal semantics preserved |
| Security | 4 | 8 | Server authz, tenancy, scrypt sessions, CSRF header, login rate limit |
| Performance | 8.5 | 8 | Route-split (Trends 360 KB, results 5.8 KB); real network calls added |
| Code quality | 8.5 | 8.5 | Single source of truth server-side; no TODO/mock/dead code |
| Automated testing | 7 | 9.5 | 93 vitest + 26 Playwright, adversarial rather than confirmatory |

---

## Council release gates

### Gate 1 — Champion workspace: **PASS**
Verified in the browser end-to-end, across two independent sessions: teacher sends a Tell-a-leader note → server record created, assigned to the school's Champion, 24 h `read_by_deadline`, notification written **and delivered** through the adapter → appears in the Champion queue triaged by SLA remaining → "Mark as read" → **the teacher sees "Read by your Champion ✓" on Today** (the criterion that failed last time) → close requires a structured outcome *and* a note (empty note rejected with `422` at the API and an inline error in the UI) → immutable audit trail (`created/assigned/viewed/acknowledged/disposition/note_recorded/closed/escalated`).
- Audit immutability is enforced at the **database**: `UPDATE`/`DELETE` on `alert_events` abort via triggers — proven by a test that attempts both with raw DB access.
- `isChampion` capability on the account drives a shield nav item; a leader without it gets a permission-denied state, not a redirect.
- Overdue alerts sort to the top with the spec's burgundy left border and "Overdue read" label; open alerts carry the gold border.
- **Alerts do not depend on the Champion opening the app**: a server-side sweep every 5 minutes escalates breached deadlines, writes an `escalated` audit event and notifies school leadership. Idempotence proven (second sweep produces no second event).
- Pattern detection (same handle, 2+ distinct staff, 5 days) fires exactly one alert; One Child rejects real names server-side.
*Evidence:* `server/safeguarding.mjs`, `server/app.mjs`, `src/screens/ChampionWorkspace.tsx`; `server/__tests__/safeguarding.test.mjs` (9 tests), `e2e/security.spec.ts` browser journey.

### Gate 2 — WCAG 2.2 AA critical journeys: **PASS**
26 Playwright tests, all green: **axe-core with color-contrast enabled** returns zero violations on 16 role/route combinations (student, teacher, leader, plus login), where the previous audit found 17 contrast failures across 10 routes. Also proven in-browser: keyboard-only pulse completion; `ArrowDown` moves focus **and** selection within the radiogroup (WAI-ARIA roving tabindex); `aria-live` progress announcements; splash skippable by tap/Enter, first-launch only, reduced-motion respected; chip and remove controls measured ≥44 px; the `aria-hidden-focus` defect inside the Trends chart is gone. A 28-test jsdom axe gate runs in `npm test` over every screen and overlay state.
*One documented limitation:* jsdom cannot compute contrast, which is exactly why the browser stage exists and gates the release.

### Gate 3 — Survey results + POUI drafting: **PASS**
A real user can create → launch → answer → close → view real results. Draft/edit/preview/launch/pause/resume/close/delete/relaunch all work; audience and year-group targeting gate eligibility server-side; duplicate submission returns `409`; surveys past their close date auto-close. The results page renders question-by-question distributions with counts and percentages from persisted rows, screen-reader data tables, field dates, open/closed state, insufficient-response state, tracker trend and a print/export path.
POUI drafting is an **assistant, not an author**: guardrails flag leading, double-barrelled (with a one-tap split), loaded, ambiguous-without-timeframe, jargon, age-inappropriate (junior audiences only), over-long, overlapping options and unbalanced scales. Suggestions require teacher acceptance and **never block launch** — proven by a test that launches a deliberately flawed survey. The builder works with the AI adapter offline (curated bank).
*Evidence:* `server/routes-extra.mjs`, `server/guardrails.mjs`, `src/screens/SurveyBuilder.tsx`, `SurveyResults.tsx`, `SurveyAnswer.tsx`; `server/__tests__/surveys.test.mjs` (20 tests).

### Gate 4 — Feedback loop: **PASS**
"You said → We did" cards render real `school_actions` rows on student and teacher Today; leaders create them via "Log an action" (leader-only server-side). Weekly Bridge exists in both versions, composed server-side from the week's real rollups — the leader edition reports the hollow/overflowing Synodal Mark, Champion attention with live watchlist and open-alert counts, and BSC implications from unsuppressed domains; the teacher edition reports their own participation and Marks. The Friday Bridge preference now **controls behaviour**: the reminder card appears only when the preference is on and it is Friday. Teacher and student personal pulse history ("My pulses") shows a real 30-day trend and streak.

---

## P0 findings: **none remain**

| Previous P0 | Status | Runtime proof |
|---|---|---|
| P0-1 client-side authorization | **CLOSED** | Signed in as a pupil, set `localStorage.role='leader'` and a forged account object, reloaded `/champion` → permission-denied screen; direct `fetch('/api/champion/overview')` from that tampered session → **403**. Identity/role/`isChampion`/school are read from the session row only. |
| P0-2 plaintext safeguarding in localStorage | **CLOSED** | Full browser journey sending "E2E-SENSITIVE…" → `localStorage` + `sessionStorage` dumped and searched: text absent. Pulse free-text drafts live in `sessionStorage` only (tab-scoped) and clear on submit. `/api/my-reports` returns read-state but never echoes disclosure text. Only two non-sensitive UI flags remain in `localStorage`. |
| P0-3 unenforced 24-hour promise | **CLOSED** | Deadline stored server-side; 5-minute sweep escalates breaches with audit event + leadership notification; teacher-visible "Read by your Champion ✓" closes the loop. Delivery is recorded by an adapter that never pretends an external message was sent. |

## P1 findings: **none remain open**
All ten previous P1s are closed and re-verified: contrast, arrow keys, live regions, target sizes, splash skip, `aria-hidden-focus`, unenforced privacy claims, Gate 3 scope, Gate 4 scope, and once-daily integrity.

## New findings this audit (P2/P3 — none block a pilot)

- **P2-1 · SQLite single-node store.** Correct and safe for a five-school pilot; a multi-school rollout needs Postgres, backups and restore drills. *Operational, not code.*
- **P2-2 · Notification delivery is a dev outbox.** By design and honestly labelled: rows are written and marked delivered, and the code never claims an SMS/email went out. Wiring a real channel is a pilot-prep task.
- **P2-3 · Session lifetime fixed at 12 h with no refresh/idle timeout.** Acceptable for a school day; revisit with the identity provider.
- **P2-4 · Login rate limit is in-process.** Fine on one node; move to a shared store when horizontally scaled.
- **P2-5 · `Trends` chunk is 360 KB.** Recharts dominates; acceptable, but a lighter chart would help low-end Android on 3G.
- **P3-1 · Demo seed ships with the server.** Guarded behind `BLOOM_SEED`/non-production, but pilot deployment should run with it off after account provisioning.
- **P3-2 · Micro-Learning citations still unverified** (`verified: false` in content, "pending editorial verification" in the UI) — an editorial task, correctly labelled rather than hidden.

## Security test results
Server-authorization suite (15 tests) passes: invalid credentials rejected; protected routes `401` without a session; logout invalidates; **login rate-limited after 10 failures** (correct passcode also refused while locked); state-changing requests without the client header rejected `403` (CSRF guard alongside `SameSite=Lax`, `HttpOnly` cookies); students blocked from Champion APIs, question banks and One Child; non-Champion teachers blocked from the Champion workspace. Passcodes are scrypt-hashed with per-user salts. No secrets in source, no `dangerouslySetInnerHTML`/`innerHTML`, no `TODO`/`FIXME`/mock markers, dependencies report 0 vulnerabilities, and the service worker never caches `/api/`.

## Cross-school test results
A Holy Cross Champion cannot read, acknowledge or close a St Joseph's alert by ID — every attempt returns `404` (existence not leaked), verified at the API and again from a real browser session. Bank edits are scoped to the caller's school regardless of a forged `schoolId` in the payload. Survey answering and results are `404` across tenants. School B's overview never contains School A's rows.

## Accessibility results
Browser stage: 26/26 green, zero axe violations with contrast enabled across 16 route/role combinations. jsdom stage: 28 checks over all screens, overlays, empty/locked/suppressed and permission-denied states. Keyboard-only completion of a full pulse verified end-to-end.

## Safeguarding lifecycle test
`tell-a-leader → server record → assigned Champion → queue → acknowledgement → teacher receipt → structured disposition → mandatory note → closure → immutable audit history` passes as one test, plus overdue escalation, escalation idempotence, distress-language triage on unflagged questions, no duplicate alerts on same-day edits, the 2-staff/5-day pattern trigger, and real-name rejection.

## Survey lifecycle test
Draft → edit → launch → respond → duplicate rejected → pause blocks → resume allows → close blocks → delete; auto-close past close date; staff-audience surveys refused to students; cross-school refused; results readable only by owner and same-school leader.

## Real-data analytics test
Verified by independent recomputation from raw rows, not by reading the UI: trend values match a hand-computed mean per day and are `null` below 20 voices; participation matches distinct responders ÷ enrolled; the perception gap computes pupil and staff top-2 shares against separate floors — a live probe returned pupil **78 % from 30 voices** (released) and staff **suppressed at 2 voices**, exactly as designed. **Prefer-not-to-say** is proven inert end-to-end: 20 PNTS answers added to a 25-pupil day changed neither the domain value nor the trend point. Anonymity boundaries tested at n=19 (suppressed), n=20 (released), n=21 (released); a 20-person cell with a 3-person complement stays suppressed (subtraction attack defeated); repeated identical queries return byte-identical results.

## False / prototype UI inventory — remaining
Of the 11 items in the previous audit, **9 are eliminated** (fabricated trend/domain/participation data, static perception gap, static What's Hot metrics, seeded "23 responses" now backed by 23 real response rows, fabricated voice counts, static "updated 3:40 pm", seeded streak, unenforced 20-voice claims, dead feedback button and inert Bridge toggle). Two remain and are **visibly labelled Sample** in the UI: the Micro-Learning Shot library (editorial, citations pending verification) and Teacher Perks (illustrative until partner agreements exist). No interface presents demo numbers as real school data.

## Full automated test results
`npm test` → **93 passed** (7 files: pulse logic incl. PNTS/rotation/timezone/DST, security/authz/tenancy, safeguarding lifecycle, surveys + anonymity + guardrails, analytics math, journeys, a11y gate).
`npm run test:e2e` → **26 passed** (contrast-enabled axe ×16, keyboard, splash, live regions, target size, tampering, cross-school, storage hygiene, once-daily across devices, browser Champion journey).
`tsc -b` clean · `oxlint` clean (0 warnings) · `npm run build` clean.
Runtime sweep: **ALL CLEAN** — zero console errors, zero page errors, zero failed requests, zero horizontal overflow across 320/390/768/1280 for student, teacher, leader and a second school.

## Human sign-off still required before pupils use Bloom
Software readiness is necessary, not sufficient. These are **not** code tasks and must not be inferred from this audit:
1. **Safeguarding policy sign-off** — named Champion per school, cover arrangements, escalation route beyond the app, and how a breached 24-hour window is handled by people.
2. **DPIA and data-protection review** — lawful basis, pupil/parent consent and withdrawal, retention and deletion schedules, subject-access handling for safeguarding notes, processor agreements.
3. **Deployment hardening** — HTTPS/HSTS, secure cookies in production, Postgres with tested restores, secrets management, `BLOOM_SEED` off, real account provisioning.
4. **Monitoring and on-call** — alerting on the SLA sweep failing, delivery-adapter failures, error rates; someone accountable when the sweep stops running.
5. **Real notification channel** — SMS/email/push contracted and tested against the outbox.
6. **Editorial verification** — the Micro-Learning citations, before school release.
7. **School governance** — pupil-facing privacy explainer approved, staff training, and agreement that Bloom is a referral point, never an emergency service.
8. **Independent penetration test** — this audit is adversarial but self-administered.

## What is strong — do not redesign
The calm cream/green/gold severity system, the two-minute contract, one-question-per-screen, positive-first scoring with PNTS exclusion, the Champion interaction model (SLA-first triage, structured outcomes, no "improvement" framing on falling alert counts), the storage/service adapter boundaries, the Poui brand and the responsive layout are all preserved exactly as the previous audit recommended. The remediation added enforcement beneath them; it did not reinvent them.

---
*Every finding above was verified at runtime on this branch. Bridges, not data exhaust.*
