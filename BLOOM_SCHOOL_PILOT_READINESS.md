# Bloom v2.1 — School Pilot Readiness (Final Acceptance Audit)

**Date:** 2026-08-19 · **Branch:** `claude/bloom-app-scaffold-build-6smu3s` (remediation commits `1303b00…` onward)
**Method:** re-audited from scratch at runtime, not from diffs. Every closed finding below was verified by executing it: 93 vitest tests (server integration on a real in-memory API + jsdom suites rendering against that same real API — no mocks), 26 Playwright browser tests (axe with contrast, keyboard, tampering, cross-school probes, storage inspection, multi-device), and a final Chromium sweep of ~150 page loads (4 viewports × 4 accounts × all routes) that finished **ALL CLEAN** — zero console errors, zero page errors, zero failed requests, zero horizontal overflow at 320/390/768/1280.
**Baseline:** `BLOOM_PRODUCTION_READINESS_AUDIT.md` (verdict then: ALPHA READY; Gates 1–4 FAIL; P0-1/2/3 open).

---

## Executive verdict: **SCHOOL PILOT READY**

*(conditional on the human sign-off list at the end — none of which is a code defect)*

Bloom is no longer a client-side prototype. A real server (`server/`, Express + SQLite, no build step) now owns identity, authorization, tenancy, safeguarding, once-daily integrity, anonymity and analytics; the client renders what the server releases and nothing else. All three P0s are closed and verified at runtime, all four Council gates pass, and there is no interface presenting demo numbers as real school data — aggregates are either computed from real persisted responses or explicitly suppressed/Sample-labelled.

- ALPHA READY — surpassed
- BETA READY — surpassed
- **SCHOOL PILOT READY — awarded: zero P0s, four gates pass, WCAG-clean critical journeys, server-enforced safety/privacy**
- PRODUCTION READY — **not awarded from code review**; see human sign-off list

## Scores

| Area | /10 | Was | Evidence |
|---|---|---|---|
| UX / usability | 8.5 | 7.5 | Real states everywhere (loading/error/retry/suppressed); done-until-midnight + edit; no dead-end promises remain |
| Accessibility | 9 | 6 | 26-test browser gate incl. contrast on 16 routes; arrow-key radiogroups; live regions; 44px targets; skippable splash; keyboard-only completion proven |
| Safeguarding | 8.5 | 5 | Server store, assignment, immutable audit (DB-trigger enforced), 24h sweep + escalation, teacher read receipts — full lifecycle tested in browser and API |
| Privacy | 8.5 | 3 | K=20 in the data layer + complement/intersection protection + staff n≥10 floor; disclosure text provably absent from browser storage |
| Survey methodology | 8 | 3 | Full lifecycle with real responses + results + tracker; deterministic guardrails + POUI drafting as suggestions |
| Functional completeness | 8.5 | 4.5 | COUNCIL_FIXES 1–5 delivered (two PARTIALs noted in P2) |
| Responsive design | 9 | 8.5 | ALL CLEAN at 320/390/768/1280 across every route incl. new screens |
| Design-system consistency | 8.5 | 8 | Palette preserved; deep text-token variants; Sample labels styled in-system |
| Security | 7.5 | 4 | Server sessions (scrypt, httpOnly, SameSite), CSRF guard, login rate-limiting, object-level authz, tenancy — pilot-grade; hardening list below |
| Performance | 8.5 | 8.5 | 104 KB gz shell + lazy chunks; SQLite server answers in ms at pilot scale |
| Code quality | 8.5 | 8.5 | tsc strict, oxlint clean, no TODO/FIXME, adapters preserved (storage adapter → typed API client; AI adapter boundary intact) |
| Automated testing | 9 | 7 | 93 vitest + 26 e2e; every remediation-spec test area covered (mapping below) |

---

## Council release gates

### Gate 1 — Champion workspace: **PASS**
Runtime evidence: browser e2e `champion journey` — teacher sends a note → server record with assigned Champion + 24h deadline + delivery through the notification adapter → Champion (separate browser session) sees it SLA-triaged, acknowledges → **teacher's Today shows "Read by your Champion ✓"** → structured disposition with mandatory note → closure → audit history (`created/assigned/viewed/acknowledged/disposition/note_recorded/closed`) rendered in the workspace. Audit rows are immutable at the database (UPDATE/DELETE abort via trigger — tested with raw DB access). Overdue: server sweep escalates exactly once past deadline, writes the `escalated` event and notifies leadership (`safeguarding.test.mjs`); overdue alerts show the burgundy left border + "Overdue read" label and sort first. `isChampion` is a server capability driving the shield nav item. A safeguarding alert **does not depend on the app being open**: creation and breach both produce deliveries through the notification abstraction (dev-safe outbox adapter that records real delivery — it never pretends an external message was sent).

### Gate 2 — WCAG 2.2 AA critical journeys: **PASS**
Runtime evidence: Playwright + axe (`wcag2a/2aa/21aa/22aa`, **contrast enabled**) clean on 16 authenticated routes across all roles incl. `/champion`, `/builder`, `/bridge` and the login screen; keyboard-only pulse completion including ArrowDown moving focus+selection in the radiogroup; polite live regions on progress and confirmations; all chip/remove/lifecycle controls ≥44px (measured); splash tap-skippable, first-launch-only, reduced-motion honoured; jsdom axe gate (28 tests) covers every state the browser matrix can't parameterise (locked/unlocked builder, suppressed results, permission-denied, sheets/modals, free-text carousel). The `sr-only` table overflow found in this audit's own sweep was fixed and re-verified.

### Gate 3 — Survey results + POUI drafting: **PASS**
Runtime evidence: a real user can **create → launch → answer → close → view real results**: jsdom journey launches a survey through the UI; server tests drive 19 → 20 → 21 real respondents through `/respond` and watch results flip from suppressed to released at exactly 20; the results page (screenshot-verified) renders per-question distributions with counts/percentages, sr data tables, field dates, open/closed state, insufficient-response state, and a tracker trend across relaunched rounds. Responses persist server-side with one-per-user enforcement (409 on duplicates) and audience/year-group eligibility. POUI drafting exists as an assistant: deterministic guardrails flag leading/double-barrelled (with one-tap split)/loaded/ambiguous/jargon/junior-register/length/overlapping-options/unbalanced-scale issues as inline notes that **never block launch and never rewrite silently**; "Draft with POUI" adds curated suggestions the teacher edits or deletes; the builder works fully with the AI adapter offline (tested).

### Gate 4 — Feedback loop: **PASS**
Runtime evidence: leader "Log an action" posts to the server store; pupils' Today renders the real latest actions ("You said → We did", with history). Weekly Bridge screens (leader: SYNODAL READ / CHAMPION ATTENTION / BSC IMPLICATION; teacher: WHAT YOUR WEEK REVEALED / NEXT WEEK / ONE SENTENCE) are composed server-side **from the week's real rollups** (marks counted from stored responses, real watchlist, real domain values) — the old unwired composers were replaced by served endpoints with screens. The Friday Bridge preference now controls real behaviour (the Friday reminder card). Teachers additionally get personal pulse history ("My pulses", real 30-day strip + streak) and leaders can compare intervention → subsequent domain movement via Log-an-action dates against the Trends deltas.

---

## P0 remaining: **none**

| Was | Closure evidence (runtime) |
|---|---|
| P0-1 client-only authorization | Signed in as a pupil in a real browser, tampered localStorage to `role:leader, isChampion:true` → UI shows permission-denied AND direct `fetch('/api/champion/overview')` from that session returns **403** (e2e `security.spec.ts`). Roles/tenancy resolve from the server session row only. Cross-school by ID: HCR champion probing an STJ alert id gets **404** from the browser and API. |
| P0-2 safeguarding in plaintext localStorage | Sent a disclosure in a real browser; local+session storage provably do not contain it (e2e). Alerts/notes/watchlist/One Child live server-side; senders receive read-state only, never echoed text; in-progress free-text drafts live in sessionStorage only (cleared on tab close/submit) and are proven absent from localStorage. |
| P0-3 unenforced 24h window | Server-side sweep (5-min interval + boot) escalates overdue alerts once, with immutable audit event + leadership notifications; teacher-visible read receipt closes the promise loop. Verified by clock-shifted server test and the browser receipt journey. |

## P1 remaining (operational, pre-go-live — not code defects)

1. **Wire a real out-of-app delivery channel** (SMS/email) into the notification adapter. The architecture, outbox and escalation jobs exist and are tested; the dev adapter records delivery honestly rather than pretending. A pilot needs a real channel for out-of-hours breach escalation.
2. **Deployment hardening:** HTTPS with `Secure` cookies (already emitted when `NODE_ENV=production`), a process supervisor, database file backups, and security headers (CSP/HSTS) at the reverse proxy.
3. **Real account provisioning:** replace seeded demo passcodes with per-school issued credentials; remove the demo quick-fill buttons from the login screen for production builds; set `BLOOM_SEED=0`.
4. **Verify Micro-Learning Shot citations** editorially before removing their Sample labels (tracked with the content since the first audit).

## P2 findings (beta improvements)

- Tracker auto-relaunch is a one-tap "Run again" on closed trackers, not a scheduled weekly job (COUNCIL_FIXES 3b asked for auto; the series/trend model is in place — add a server cron like the SLA sweep). **PARTIAL**
- Free-text results are a quote list (≥20 voices), not theme-grouped (3a). Grouping needs the AI adapter or curated theming. **PARTIAL**
- "My class" audience currently equals the whole school — no class/form model exists yet; documented in code.
- Session tokens are fixed 12h (no rotation/refresh); acceptable for pilot, rotate for production.
- The National Report was **removed rather than faked** — reinstate only when multi-school aggregation exists.
- Survey deletion is hard-delete (drafts/closed only); consider soft-delete + audit for governance.
- Suppressed trend days render as gaps with an explanation; consider a school-facing "why is this blank" explainer page.

## P3 (polish)
Remaining "✓" glyphs inside a few button labels; `#4A4636` body-ink and a handful of literal hex values still bypass tokens; print stylesheet for results is browser-default.

---

## Role × capability verification (server-enforced, tested)
Student: pulse ✓, surveys-to-answer ✓, You-said→We-did ✓, Tell-a-leader ✓, history ✓; banks/builder/results/champion → 403/permission-denied ✓. Teacher: + banks, builder, results (own), One Child, receipts; champion → 403 unless `isChampion` ✓. Leader: + all-results, Log-an-action, BSC export, leader Bridge; Champion surfaces only with `isChampion` ✓. Cross-school: every object route scoped by session school; probes return 404 ✓.

## Safeguarding lifecycle test: **PASS** (browser + API, described under Gate 1)
## Cross-school isolation tests: **PASS** (`security.test.mjs`, `surveys.test.mjs`, `security.spec.ts`)
## Accessibility results: **PASS** (26 e2e + 28 jsdom, zero violations; contrast in-browser)
## Survey lifecycle test: **PASS** (draft→edit→launch→respond→pause→resume→close→auto-close→delete→relaunch)
## Real-data analytics test: **PASS** — trend/domain/participation/perception-gap each recomputed independently in tests from raw rows and matched; PNTS proven inert through the whole pipeline (20 PNTS answers moved no aggregate); Holy Cross (6 pupils) proves small-school suppression end-to-end.

## False/prototype UI remaining
Only **labelled** editorial content: Micro-Learning Shot library and Teacher Perks carry visible "Sample" badges and explanatory copy; the What's Emerging signal list itself is real. Demo school data consists of real seeded database rows served through the same pipeline as live input (documented in `server/seed.mjs`). Nothing presents a fabricated number as school data; fabricated voice counts, static averages/gaps/timestamps, the static National Report, the dead feedback button and the inert Bridge toggle are all gone (removed, computed, or functional).

## Test coverage vs the 24 required areas
1 server authorization ✓ (`security.test.mjs`) · 2 cross-school ✓ (×3 suites) · 3 safeguarding absent from localStorage ✓ (jsdom + e2e) · 4 Champion assignment ✓ · 5 acknowledgement ✓ · 6 audit history ✓ (incl. immutability) · 7 overdue SLA escalation ✓ (idempotent) · 8 teacher read receipt ✓ (API + browser) · 9 n=19/20/21 ✓ · 10 small-cell/intersection ✓ (cell + complement + re-query determinism) · 11 response persistence ✓ · 12 per-survey results ✓ · 13 close lifecycle ✓ · 14 POUI guardrails ✓ (7 codes + junior + non-blocking) · 15 PNTS exclusion ✓ (unit + pipeline) · 16 perception-gap calc ✓ (75%/80% recomputation) · 17 trend/domain calc ✓ (independent recomputation) · 18 You-said→We-did permissions ✓ (leader-only POST) · 19 Weekly Bridge ✓ (a11y + real-rollup composition) · 20 once-daily across devices ✓ (e2e two contexts + server UNIQUE + tz tests incl. DST) · 21 keyboard pulse ✓ · 22 arrow-key radiogroup ✓ · 23 real-browser axe ✓ · 24 contrast ✓.
**Full runs:** vitest 93/93 · Playwright 26/26 · `tsc -b` clean · oxlint clean · `npm run build` clean · final sweep ALL CLEAN.

## Requires human sign-off before a real school (not assessable from code)
DPIA/data-protection review and lawful-basis documentation; safeguarding-policy alignment (Champion role designation, breach escalation procedure, disclosure retention/DSAR policy); parent/pupil consent materials; Ministry/CEBM governance approvals; hosting/deployment/monitoring/backup operations; editorial verification of research citations; passcode distribution and account lifecycle process; incident response. **No GDPR/legal compliance is claimed from this code review.**

---
*Preserved throughout, per instruction: calm cream/green/gold severity, two-minute contract, one-question-per-screen, the audited scoring/rotation logic (moved server-side verbatim, tests ported), PNTS behaviour, the Champion interaction model, adapter boundaries, Poui/Bloom brand, and the responsive layout.*
