# Handoff: Bloom — Pastoral Pulse Mobile App (EduTrend redesign)

## Overview
Bloom ("Your Voice Matters") is the redesign of EduTrend into the BLOOM Foundation's pastoral sensing layer for Trinidad & Tobago Catholic schools. Three roles share one mobile-first app: **Students** answer a short rotating "Your Voice Today" carousel; **Teachers** run a two-minute Daily Pulse and read collated insights; **Leaders** answer a weekly decision-oriented Leader Pulse and see perception-gap analytics. A **Survey Builder** unlocks for teachers/leaders after 10 completed pulses.

## Order of work
1. Run `AUDIT_BRIEF.md` against the existing EduTrend codebase FIRST (audit, don't refactor).
2. Read `DESIGN_REVIEW.md` — known prototype defects to correct during implementation.
3. Implement this design per the sections below, honouring `PASTORAL_PULSE_SPEC.md` in the repo (data model: Synodal Marks, One Child, Champion alerts, POUI, BSC rollups, Weekly Bridge).

## About the Design Files
`Bloom App.dc.html` is a **design reference created in HTML** — a working prototype showing intended look and behavior, NOT production code. Recreate it in the target codebase's environment (React 19 + TypeScript + Tailwind + Vite + Recharts per the EduTrend stack). Open the file in a browser to interact with every flow. Keep the PWA shell, Service Worker, offline queueing and local-first persistence that already exist.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and copy are final unless DESIGN_REVIEW.md flags them (contrast fixes, icon replacement). Recreate pixel-perfectly using Tailwind tokens (§ Design Tokens).

## Design Tokens
Colors (create semantic Tailwind tokens; do not scatter hex):
- `bloom-cream` #FAF6EC (app bg) · `bloom-cream-dim` #F3EFE2 · `bloom-sand` #EDE6D3 · `border` #E8E2CF / #E0D9C6
- `bloom-green` #295C4D (primary) · `bloom-green-deep` #1D4438 · `bloom-charcoal` #22342C (ink + dark surfaces)
- `bloom-gold` #C8A951 · `bloom-gold-bright` #E9B93B (accents, progress, unlock)
- Synodal/theme: relating gold #C8A951 · listening blue #4A8AD0 · discerning green #5BAA70 · self-emptying purple #8E6FB6 · safety burgundy #6E2B2F
- Signal: good #5BAA70 · warn #E19A45 / #C8A951 · concern #D9634E
- Text: primary #22342C · secondary #5A6156 · metadata #98917C (darken per review) · on-dark #F3EFE2 / #BFD3C6
Typography: display **Bricolage Grotesque** (600/700/800; wordmark 800 32–34px, page titles 800 26px, card titles 700 17–23px); body **Instrument Sans** (400–700; body 13–14px, metadata 11–12px, micro-labels 10px 700 letterspaced .12–.14em uppercase).
Radii: cards 18px · rows/inputs 13–14px · chips/badges 99px · phone shell 38px. Shadows: cards borderless-flat with 1px border; phone shell 0 18px 50px rgba(34,52,44,.14).
Motion: petal bloom ~600–700ms cubic-bezier(.2,.9,.3,1.2) staggered 100–120ms; fadeUp 500–600ms; all interactions 150–250ms; respect `prefers-reduced-motion`.

## Brand mark & splash
Six-petal Poui blossom: gold gradient petals (#E9B93B→#C8A951) around a #295C4D center. Launch: center appears, petals bloom staggered, "Bloom" wordmark then "YOUR VOICE MATTERS" fade up; total ≤1s of blocking, first launch only. The mark recurs at small size in the header (conic-gradient token in prototype — build a proper SVG `BloomLogo` component).

## Screens (all in `Bloom App.dc.html`; switch roles via header chip)
1. **Splash** — see above.
2. **Today (Student)** — hero card (green) with CTA to carousel; streak + "2 min" stat pair; privacy explainer (gold-tinted card); positive weekly note. After submission the hero flips to thanks state.
3. **Today (Teacher)** — Pastoral Pulse score card (dark green, gold score /100, 7-day sparkbars, LIFTING/STEADY/NEEDS ATTENTION); "lessons make sense" distribution card with theme badge; "Worth noticing" connected-signal card (purple accent, chips, never diagnoses); POUI micro-move card (gold-tinted; Tried/Save toggles + "Ask POUI GPT ↗" link to https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0); One Child watchlist (charcoal); Survey Builder promo card with unlock progress; quiet "Tell a leader" underlined link.
4. **Today (Leader)** — perception gap card (staff 84% vs pupils 67%, charcoal); "whose voice least heard" cohort bars; Worth noticing; Champion watchlist summary; "one small change to test tomorrow" + Leader Pulse CTA; Survey Builder card.
5. **Pulse carousel** (all roles) — one question per screen: theme badge (theme color), 23px question, full-width option buttons (selected = green fill + ✓), gold progress bar, Back/Next, footnote. Student: 12-question bank rotated 3–5/day + weekly reflection; options are per-question (e.g. Yes/Mostly/Not really/No, Prefer not to say — EXCLUDE from scoring). Teacher: 5 questions with Synodal Mark badges (R/L/D/SE). Leader: 5 weekly decision questions. Done state: mini bloom + role-specific copy. Empty bank state: "Today's voice is still gathering."
6. **Question manager** (teacher/leader) — per-question card: theme badge, type chip (Choice ↔ Free text toggle), delete, inline text edit, options preview line; add-question; changes apply to carousel instantly.
7. **Survey Builder** — LOCKED until `pulsesCompleted >= 10` (server-side counter): lock screen with bloom icon, progress bar, "X of 10 pulses completed", CTA to today's pulse. UNLOCKED: title input, audience chips (My class / Whole school / Staff), question list (same row pattern), Launch (disabled until title + ≥1 question), success banner, "Your surveys" list with LIVE badge and response counts. Entry: promo card on teacher/leader Today ("SURVEY BUILDER / Launch your own survey", gold progress bar, "N to go" / "Open →").
8. **Trends** — range tabs (7 days/30 days/Term); pulse-over-time line chart (green line, gold area fill 15%, gold dot on today) — use Recharts; 8-domain snapshot bars (Safety & peers, Belonging, Trusted adults, Emotional load, Engagement, Learning, Voice & fairness, Home context) with ▲▼ deltas; participation bars by day; recurring themes ranked list. Completed pulses collate into today's point + counts.
9. **What's Hot** — National Report entry card (charcoal, NEW badge); privacy-shield note; theme cards (category, heat %, title, body, heat gradient bar, "why surfaced" provenance, "⚡ Micro-Learning Shot" button).
10. **Micro-Learning Shot modal** — green gradient header with gold ⚡ tile and ✕; "MICRO-LEARNING SHOT" label; topic title; "The concept" card; "Try this tomorrow" card (gold-tinted); "Grounded in research" card (one T&T line + one wider-evidence line — store citations with content); "Got it, thanks →" + "POUI GPT ↗".
11. **National Report overlay** — charcoal header (month, 12,450 participants, +15% participation in green); national headline quote card (green left border); regional bars North/Central/South/East/Tobago; aggregation note.
12. **Profile** — identity card (per role); School Type / Board / Location rows; **Teacher Perks** gold gradient row ("4 New") → bottom sheet with 4 perk rows; Carousel questions link (teacher/leader); Friday Bridge digest toggle; Send Feedback; privacy explainer; version footer.
13. **Tell a leader sheet** — bottom sheet: calm explainer ("not an emergency alert"), optional note, Cancel / "Send to Champion" (burgundy), confirmation "A leader will read this within 24 hours". Wire to ChampionAlert queue per spec.

## Navigation
Bottom bar, 5 items: Today · Trends · Pulse (center) · What's Hot · Profile. Active = bloom-green + weight 800; inactive #A8A18B. Replace glyphs with Lucide icons. Desktop (768+): side rail, two-column Today, Trends gets width; keep narrative hierarchy (see pasted product brief in repo `CLAUDE_CODE_PROMPTS.md`).

## State Management (prototype behavior to replicate against real APIs)
- `role` from auth (prototype: header chip cycles for demo).
- Per-role question banks (student 12 / teacher 5 / leader 5), editable by teacher/leader; student rotation 3–5/day + weekly reflection, seeded server-side.
- `answers` keyed role+questionId; submit → collates into pulse score (positive-first option scoring, exclude "Prefer not to say"), participation, trends; increments `pulsesCompleted` (teacher/leader) driving the 10-pulse Survey Builder unlock.
- `mySurveys` per role with live response counts; micro-move Tried/Saved; Bridge digest toggle; Champion alert on Tell-a-leader submit.
- Free-text triage → Champion alert per spec § 4.3 (Gemini classify routine/noticing/concerned/alarmed).

## Assets
No binary assets. Fonts via Google Fonts (Bricolage Grotesque, Instrument Sans). Bloom mark: build as SVG from the petal geometry in the prototype (6 petals, 60° rotation steps, gold gradient, green center).

## Files
- `Bloom App.dc.html` — the full interactive design reference (open in a browser)
- `AUDIT_BRIEF.md` — run first against the codebase
- `DESIGN_REVIEW.md` — prototype defects to correct
- `REPO_CONTEXT.md` — source repo association
- In the repo: `PASTORAL_PULSE_SPEC.md` (data architecture), `CLAUDE_CODE_PROMPTS.md`
