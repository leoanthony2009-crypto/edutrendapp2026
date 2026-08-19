# Bloom Prototype — Heuristic Design Review (known issues to fix in implementation)

Scope: the HTML design prototype `Bloom App.dc.html` in this folder. This is the design-side half of the audit — the codebase-side audit is `AUDIT_BRIEF.md`. Classifications follow the same P0–P3 scale. These are defects to CORRECT when implementing, not to reproduce.

## P1 — fix before launch

1. **Keyboard & screen-reader access.** All interactive elements in the prototype are `div onClick` — no `<button>`, no focus states, no tab order, no ARIA. Implement every control as a semantic `<button>`/`<a>`/`<input>` with visible `:focus-visible` states. (WCAG 2.2 AA: 2.1.1, 2.4.7)
2. **Contrast failures on small text.** Metadata gray `#98917C` on cream `#FAF6EC` (~3.2:1) fails AA for text under 18px; dark-ink text on gold `#C8A951` chips is borderline. Darken metadata to ≥ `#6F6A58` and verify all gold-background text at 4.5:1. (1.4.3)
3. **"Prefer not to say" is scored.** The pulse average currently treats "Prefer not to say" as the worst answer index. It must be excluded from scoring entirely — both an ethics and a data-integrity issue.
4. **Free-text answers use single-line inputs.** Reflection questions ("something you wish adults understood") need `<textarea>` with a generous min-height and a character guide.
5. **No persistence.** All state (answers, submitted flags, custom questions, launched surveys, unlock progress) is in-memory and resets on reload. Implement against the app's existing localStorage/offline-queue layer per the spec's local-first architecture.
6. **Splash blocks every launch (~2.4s).** Show the bloom animation on first launch only; subsequent opens should skip or shorten it. `prefers-reduced-motion` is respected in the prototype — keep that.
7. **Role switch is a demo affordance.** The header chip cycles Student → Teacher → Leader with no auth. Real roles come from authentication/authorization; the chip should become a context indicator (and a context switcher only where a user legitimately holds multiple roles).

## P2 — important improvements

8. **Chart accessibility.** Trend line, domain bars and regional bars are visual-only. Provide text alternatives (e.g. a data table or `aria-label` summaries).
9. **Question rotation is client-clock based.** `new Date().getDay()` drives the student rotation — move rotation server-side (or seed from school-configured timezone) so a class sees the same set.
10. **Survey Builder lifecycle.** Launched surveys can't be edited, paused, closed or deleted; add those states. Enforce the 20-voice anonymity threshold server-side, not just as copy.
11. **Unlock progress source of truth.** The 10-pulse unlock counter must live on the server per user; the prototype seeds teacher=9, leader=12 for demo purposes.
12. **Touch targets.** Bottom-nav items and small chips (theme/type toggles, "✕" remove) are under 44px in places; pad hit areas.
13. **Error/loading states.** The prototype has empty and success states but no network error or skeleton loading states — required for the real, API-backed app (see AUDIT_BRIEF acceptance gate).
14. **Micro-shot research citations are indicative, not verified.** Confirm exact studies (MoE T&T safety reviews, UWI Caribbean Curriculum SBA research, Astor & Benbenishty, Putwain, EEF) before shipping to schools; store citations with the content, not hardcoded.

## P3 — polish

15. Unicode glyphs (⌂ ∿ ✿ ✦ ○ ⚡ ◍) stand in for icons — replace with the app's Lucide icon set at consistent sizes.
16. The "Run again" affordance on the done screen is demo-only; real pulses are once per day.
17. External POUI GPT link opens ChatGPT in a new tab with no warning; add an "opens outside Bloom" hint and consider passing pulse context via the app's own POUI service (`gemini` per spec) rather than a public GPT.
18. Long survey titles / long question text are untested; ellipsize or wrap deliberately.

## What the prototype gets right (preserve these)

- Two-minute contract: 3–5 rotated questions, one per screen, giant tap targets for answers.
- Calm severity design: no red-alert UI; "Worth noticing" phrasing; safeguarding as a quiet underlined link.
- Privacy provenance on every insight (response counts, anonymised, 20-voice threshold).
- Semantic use of the four Synodal/Bloom colors; cream/green/gold everywhere else.
- Perception-gap framing for leaders ("neither view is automatically correct").
- Unlock mechanic ties creation rights to participation ("blooms with your voice").
