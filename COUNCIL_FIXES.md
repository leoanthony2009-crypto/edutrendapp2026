# COUNCIL FIXES — remediation spec for Claude Code

Implements the four gaps + voice asks from `COUNCIL_REVIEW.md`. Apply AFTER the base build from `CLAUDE_CODE_PROMPT.md` / `README.md`, in this order. All UI follows the Bloom tokens in README (cream/green/gold, Bricolage Grotesque + Instrument Sans, 18px cards, calm severity).

---

## FIX 1 — Champion workspace (P0, safeguarding)

New role surface for users with `isChampion: true` (a flag on teacher/leader accounts). Add a "Champion" item to their navigation (shield-style Lucide icon, never alarming red).

**Watchlist screen** (spec `PASTORAL_PULSE_SPEC.md` §3.4):
- List pupils appearing in ≥2 One Child entries across ≥3 days in the past 14 days.
- Row: pseudonymous handle (e.g. `F2-073`), mention count + day count ("3 staff · 4 days"), concatenated `notedFor` pattern text, Synodal Mark chips, status badge.
- Row actions (buttons, keyboard accessible): **Reviewed** · **Parent contact** · **Safeguarding** — each writes `status` + `championReadBy` + timestamp to the entry.

**Alert queue**: every `ChampionAlert` (free-text trigger, Tell-a-leader, 2+ teacher pattern) renders as a card with `triggeredAt`, sanitised context, marks, and a **countdown to `readByDeadline` (submittedAt + 24h)**. States: `open` (gold border) → `reviewed` → `actioned`. Overdue (past deadline, still open): burgundy left border + "overdue read" label + it sorts to top. No sounds, no red banners.

**Teacher-side confirmation** stays exactly: "A leader will read this within 24 hours" — but now set it true: mark the alert read when the Champion opens it, and surface "Read by your Champion ✓" back on the teacher's Today the next day.

Data: `championAlerts` + `oneChildEntries` stores in the localStorage layer; selectors for pattern detection (same pupilHandle from 2+ distinct `submittedBy` within 5 days ⇒ auto-alert, `triggerType: "pattern"`).

**Acceptance**: submit a Tell-a-leader note → alert appears in Champion queue with 24h deadline → acknowledge → teacher sees "Read ✓". Pattern alert fires when two seeded teachers note the same handle.

## FIX 2 — Accessibility gate (P0, ships with FIX 1)

Blockers, all on the pulse journey first:
1. Every interactive element is a real `<button>`/`<a>`/`<input>`/`<textarea>` with `:focus-visible` ring (2px `#295C4D` offset 2px on cream; `#E9B93B` on dark surfaces).
2. Full keyboard path: Tab through nav → carousel options (radiogroup: `role="radiogroup"`, options `role="radio"` + arrow keys) → Back/Next. Enter/Space activates.
3. Contrast: metadata `#98917C` → `#6F6A58` app-wide; verify dark-on-gold chips ≥4.5:1 (darken gold bg to `#B99434` where text sits on it); re-check LIVE/NEW badges.
4. Free-text questions: `<textarea rows=3>` with visible label and char guide, not `<input>`.
5. Charts: each chart gets an `aria-label` sentence summary AND a visually-hidden data table (`<table class="sr-only">`).
6. Touch targets ≥44×44: bottom nav items, ✕ remove, type/theme chips (pad hit area, keep visual size).
7. `aria-live="polite"` on: pulse progress label, "Launched" banner, feedback confirmation, Champion-read confirmations.
8. Splash: first launch only (persist `hasLaunched`), skippable on tap, ≤1s, `prefers-reduced-motion` renders the final frame instantly.
9. "Prefer not to say" (and any skipped answer) excluded from all scoring — assert with a unit test.

**Acceptance**: axe-core clean on pulse journey + Today; complete a full pulse with keyboard only; screen reader announces question, options, progress.

## FIX 3 — Survey Builder parity with YouGov (P1)

**3a. Per-survey results page.** Tapping a launched survey opens `SurveyResults`:
- Header: title, audience, status (Live/Closed), response count vs audience size, close date.
- Per question: choice questions → horizontal distribution bars (Bloom signal colors, counts + %); free text → theme-grouped list, individual quotes shown ONLY when ≥20 respondents (else "Gathering — appears at 20 voices").
- Trend tab if the survey has run ≥2 times (tracker mode).
- Actions: Close early · Duplicate · Export summary (print stylesheet).

**3b. Survey lifecycle.** Add to builder: close date picker (default 7 days), Live → Closed states, pause, delete draft. "Tracker" toggle = auto-relaunch weekly/monthly, results page grows a trend line.

**3c. POUI-assisted drafting.** In the builder, "✿ Draft with POUI" button per question and for the whole survey:
- Service interface `poui.draftQuestions({topic, audience, count})` behind the same adapter as micro-moves (Gemini per spec; curated fallback bank offline).
- Guardrails run on EVERY question (typed by hand or drafted): flag leading ("Don't you agree…"), double-barrelled ("…and…?" with two clauses), jargon, >20 words. Show as a gentle inline note ("This asks two things — split it?") with one-tap fix. Never block launch; warn.
- Audience targeting: add year-group multi-select under the existing class/school/staff chips.

**Acceptance**: launch a survey → seeded responses render a results page; a double-barrelled question gets flagged with a suggested split; tracker survey shows a 2-point trend.

## FIX 4 — Close the loop (P1)

**4a. "You said → We did"** — student Today card + a monthly full screen:
- Data: leaders attach an `action` to any insight/theme ("You told us break time felt unsafe → the library now opens at first break"). Store `{signalSummary, actionTaken, date}` per school.
- Student card cycles the latest 1–3; monthly screen lists the term. Tone: plain, factual, no self-congratulation.
- Leader side: "Log an action" button on Worth-noticing/theme cards feeds this store.

**4b. Weekly Bridge screens** (spec §6): Friday-generated digest, one screen each:
- Leader: SYNODAL READ OF THE WEEK / CHAMPION ATTENTION / BSC IMPLICATION (three stacked cards).
- Teacher: WHAT YOUR WEEK REVEALED (participation, marks touched, anonymised mentions) / WHAT NEXT WEEK MIGHT HOLD / ONE SENTENCE TO TAKE HOME (gold card, italic).
- Generated via the POUI adapter from the week's rollup; fallback: template strings from real rollup numbers. Entry: the existing "Friday Bridge digest" toggle in Profile becomes a row that opens the latest digest; badge on Friday.

## FIX 5 — Voice asks (P2, batch)

- **Once daily**: remove "Run again"; after submission the Pulse tab shows the done state until local midnight. Add "Edit today's answers" until midnight instead.
- **Personal history** (teacher + student): "My pulses" in Profile — calendar strip of completed days, personal 30-day mini-trend (their own scale answers only, never shown to others), streak with one "streak repair" per term for absence.
- **Age-tiered language**: student question bank gets `juniorText` variants (Forms 1–2 / primary): "Did you feel safe today?", "Did someone listen to you?", "Did you get a turn?", "Was anything making today hard?" Selected by the account's year group.
- **Micro-move outcomes**: "Tried ✓" prompts a one-tap follow-up next day ("Did it help? Yes / A little / No") feeding Trends § micro-move outcomes.
- **Icons**: replace all glyphs (⌂ ∿ ✿ ✦ ○ ⚡ ◍) with lucide-react: Home, TrendingUp, Flower2, Sparkles, User, Zap, Globe2 — 20px, stroke 2, currentColor.
- **Champion read receipts** on Tell-a-leader history (teacher Profile).

## Definition of done for this batch
FIX 1+2 are launch blockers (P0): both complete, axe-clean, tested. FIX 3–4 before school pilot. All new flows keyboard-accessible from day one — the FIX 2 standards apply to every screen added by FIX 1, 3, 4, 5. `npm run build` clean; tests: scoring exclusions, pattern-alert detection, 24h deadline math, guardrail flagging, rotation.
