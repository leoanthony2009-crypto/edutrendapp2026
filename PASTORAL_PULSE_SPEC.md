# PASTORAL PULSE — EduTrend Refactor Specification

> **Read before implementing.** This document is the engineering brief for refactoring EduTrend into the Pastoral Pulse layer of the BLOOM Foundation. It is paired with `CLAUDE_CODE_PROMPTS.md`, which sequences the work into discrete prompts you can run in Claude Code.

**Source documents:** `BLOOM_Pastoral_Pulse_Council_Brief.docx` (the seven-voice council and its design moves) and `BSC_Pastoral_Pulse_Template.pptx` (the school-facing dashboard the platform feeds).

**Stack assumptions (from EduTrend overview):** React 19 + TypeScript, Tailwind CSS, Vite, Recharts, `@google/genai` SDK (`gemini-2.5-flash`, `gemini-3-pro-preview`, `gemini-2.5-flash-native-audio-preview`, `gemini-2.5-flash-image`), localStorage as current persistence, Service Worker offline queueing, Lucide React icons.

---

## 1. The headline change

EduTrend stops being a standalone teacher feedback PWA and becomes the **Pastoral Pulse** — the daily sensing layer of the BLOOM Foundation's Pastoral Intelligence stream. The teacher-facing UX stays as light as it was (two-minute contract preserved), but the data architecture and the AI behaviour are re-rooted around four ideas:

1. Every question carries a **Synodal Mark** (Relating · Listening · Discerning · Self-Emptying).
2. Every Pulse run optionally captures **One Child** — an anonymised pupil identifier that the teacher is holding in mind.
3. The "Tip" engine is replaced with **POUI Pastoral Micro-Moves** — one-sentence, context-conditioned coaching, generated from the Pulse just submitted.
4. Pulse data flows upward into the **five-KPI Balanced Scorecard** at school, diocesan, and system level, and downward as a **Weekly Bridge** digest with two versions: leader and teacher.

A **Safeguarding pathway** sits beneath every Pulse — a one-tap escalation to the school's Pastoral Champion within 24 hours, triggered by free-text or sentiment thresholds. This is non-negotiable.

---

## 2. Data model changes

All schemas use TypeScript. Existing code likely lives in `src/types/` (or `constants.ts` per the overview). Add or modify the following types.

```ts
// src/types/synodal.ts  (NEW)
export type SynodalMark = "R" | "L" | "D" | "SE";

export const SYNODAL_MARKS: Record<SynodalMark, { label: string; color: string; description: string }> = {
  R:  { label: "Relating",      color: "#C8A951", description: "Whose voice was present, and whose was not." },
  L:  { label: "Listening",     color: "#4A8AD0", description: "What the school was being told and may not have heard." },
  D:  { label: "Discerning",    color: "#5BAA70", description: "What the teacher noticed and named." },
  SE: { label: "Self-Emptying", color: "#8E6FB6", description: "What the school absorbs without complaint." },
};

// src/types/bsc.ts  (NEW)
export type BSCPillar = "AE" | "SD" | "TL" | "CS";

export const BSC_PILLARS: Record<BSCPillar, { label: string; color: string; qas: string[] }> = {
  AE: { label: "Academic Excellence",        color: "#295C4D", qas: ["S1", "S3"] },
  SD: { label: "Student Development",        color: "#6E2B2F", qas: ["S3"] },
  TL: { label: "Teaching & Leadership",      color: "#2E5266", qas: ["S1", "S2"] },
  CS: { label: "Community & Stakeholders",   color: "#6E548D", qas: ["S4", "S5"] },
};
```

Modify the existing `SurveyQuestion` (or equivalent) type — every question must now carry a Mark and a routing pillar:

```ts
// src/types/survey.ts  (MODIFY)
export type QuestionDomain = "infrastructure" | "wellness" | "curriculum" | "one_child";
export type QuestionType   = "scale" | "single_select" | "multi_select" | "free_text" | "one_word" | "pupil_anchor";

export interface PulseQuestion {
  id: string;
  domain: QuestionDomain;
  type: QuestionType;
  text: string;
  options?: string[];
  mark: SynodalMark;             // NEW — required
  routesTo: BSCPillar[];         // NEW — which BSC pillars this answer feeds
  triggersChampion?: boolean;    // NEW — does this question's free-text route to the Pastoral Champion
}

export interface PulseResponse {
  questionId: string;
  value: string | number | string[];
  mark: SynodalMark;             // copied for audit
  submittedAt: string;           // ISO datetime
}

// NEW — One Child anchor
export interface OneChildEntry {
  pupilHandle: string;     // anonymised, e.g. "Y4-073" — never the actual name
  yearGroup: string;
  notedFor: string;        // free text, max 120 chars
  submittedBy: string;     // teacher ID
  submittedAt: string;
}
```

Sample questions, re-tagged from the existing EduTrend domains (infrastructure, wellness, curriculum). Replace the current `constants.ts` survey bank with this:

```ts
// src/data/pulseQuestions.ts  (NEW or REPLACE existing question bank)
export const PULSE_QUESTIONS: PulseQuestion[] = [
  // Infrastructure
  { id: "infra_workable", domain: "infrastructure", type: "scale", text: "Was your classroom workable today (heat, light, space, supplies)?",
    mark: "SE", routesTo: ["CS"] },
  { id: "infra_silent",   domain: "infrastructure", type: "free_text", text: "Did anything break that you absorbed without reporting?",
    mark: "L",  routesTo: ["CS", "SD"], triggersChampion: false },
  // Wellness
  { id: "well_one_word",  domain: "wellness", type: "one_word", text: "How are you, in one word, today?",
    mark: "R",  routesTo: ["SD"] },
  { id: "well_one_child", domain: "one_child", type: "pupil_anchor", text: "Is there a child you went home thinking about?",
    mark: "D",  routesTo: ["SD"], triggersChampion: true },
  { id: "well_leader",    domain: "wellness", type: "free_text", text: "Did anything happen today that you would want a leader to know?",
    mark: "L",  routesTo: ["SD", "TL"], triggersChampion: true },
  // Curriculum
  { id: "curr_landing",   domain: "curriculum", type: "scale", text: "Did the lesson land?",
    mark: "D",  routesTo: ["AE"] },
  { id: "curr_change",    domain: "curriculum", type: "free_text", text: "What did you change in the moment, and why?",
    mark: "SE", routesTo: ["AE", "TL"] },
  { id: "curr_voice",     domain: "curriculum", type: "free_text", text: "Whose voice did you not hear today?",
    mark: "R",  routesTo: ["SD"], triggersChampion: false },
];
```

---

## 3. Component changes

### 3.1 Replace the existing `SurveyQuestion` renderer

Rename to `PulseQuestion` (or wrap). Each rendered question must:

- Show a **MarkBadge** in the top-right corner of the question card.
- Show a **2-minute timer** at the top of the Pulse run (preserve existing visual countdown).
- Surface the **Safeguarding** affordance at the bottom of any question with `triggersChampion: true` *and* whenever a free-text response exceeds a sentiment threshold (see § 4).

```tsx
// src/components/MarkBadge.tsx  (NEW)
import { SYNODAL_MARKS, type SynodalMark } from "@/types/synodal";

export function MarkBadge({ mark, size = "sm" }: { mark: SynodalMark; size?: "sm" | "md" }) {
  const cfg = SYNODAL_MARKS[mark];
  const dims = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";
  return (
    <span
      title={`${cfg.label} — ${cfg.description}`}
      className={`inline-flex items-center justify-center rounded font-bold uppercase text-white ${dims}`}
      style={{ backgroundColor: cfg.color }}
    >
      {mark}
    </span>
  );
}
```

### 3.2 New: `OneChildEntry` component

A guarded input that **never accepts a real name**. Inputs are validated against a heuristic (e.g. detects capitalised first names and rejects with a soft prompt to use the year-group + handle convention).

```tsx
// src/components/OneChildEntry.tsx  (NEW)
import { useState } from "react";

export function OneChildEntry({ onSubmit }: { onSubmit: (e: OneChildEntry) => void }) {
  const [yearGroup, setYearGroup] = useState("");
  const [handle, setHandle] = useState("");
  const [notedFor, setNotedFor] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const looksLikeRealName = (s: string) =>
    /^[A-Z][a-z]{2,}(\s[A-Z][a-z]{2,})?$/.test(s.trim());

  const handleSubmit = () => {
    if (looksLikeRealName(handle)) {
      setWarning("Use a handle (e.g. Y4-073), not a name. The Pulse is anonymised by design.");
      return;
    }
    onSubmit({
      pupilHandle: `${yearGroup}-${handle}`,
      yearGroup, notedFor,
      submittedBy: getCurrentTeacherId(),
      submittedAt: new Date().toISOString(),
    });
  };
  // ...JSX with inputs, warning surface, submit button
}
```

### 3.3 New: `SafeguardingButton`

A persistent affordance on every Pulse page. Triggers a one-tap modal that posts an alert to the school's Pastoral Champion (mock for now via `localStorage` queue + a `championAlerts` Recoil/state slice). The button is **never** styled in a way that suggests urgency or panic — it is a quiet, always-available channel.

```tsx
// src/components/SafeguardingButton.tsx  (NEW)
export function SafeguardingButton({ context }: { context: string }) {
  return (
    <button
      onClick={() => openSafeguardingModal({ context })}
      className="text-xs text-burgundy-700 underline-offset-2 hover:underline"
    >
      Tell a leader · 24-hour Champion read
    </button>
  );
}
```

The modal collects an optional free-text note, the (anonymised) pupil handle if relevant, and queues a `ChampionAlert` for delivery (see § 4.2).

### 3.4 New: `ChampionWatchlist` page

Lists One Child entries aggregated across staff and days, showing pupils who have appeared in **two or more** Pulses across **three or more** days in the past two weeks. Each row exposes:

- Anonymised handle
- Mention count + day count
- The pattern (concatenated `notedFor` entries)
- Synodal Marks breakdown
- Champion action ("Reviewed" / "Parent contact" / "Safeguarding")

This is the content of slide 10 in the dashboard template — the page should render cleanly enough to screenshot for the dashboard.

### 3.5 Replace the article-based "Daily Read" surface

Keep the route, but the content is now a **Pastoral Micro-Move** generated by POUI from this teacher's just-submitted Pulse. See § 5.

---

## 4. Routing logic — Pulse data → consequences

Every Pulse run must be classified for three downstream actions: BSC routing, Champion alerting, and POUI conditioning.

### 4.1 BSC routing

Aggregate the day's responses by `routesTo` pillar. Persist a per-school, per-day rollup:

```ts
interface PulseRollup {
  schoolId: string;
  date: string;                     // YYYY-MM-DD
  participation: number;            // % of staff who completed today's Pulse
  byMark: Record<SynodalMark, number>;       // count of responses per Mark
  byPillar: Record<BSCPillar, {
    avgScore: number;               // for scale questions, normalised 0-1
    qualitativeCount: number;       // count of free-text submissions
    flagCount: number;              // count of triggersChampion submissions
  }>;
  oneChildEntries: number;
  safeguardingTriggers: number;
}
```

Expose a `/api/bsc/rollup?schoolId=&from=&to=` endpoint shape (route via your existing API or fetch layer; for now this can be a localStorage-backed function returning the same shape) for the dashboard to consume.

### 4.2 Champion alerting

A `ChampionAlert` is generated when **any** of the following:

- A `triggersChampion: true` question receives a non-empty free-text response
- The `SafeguardingButton` is invoked
- A pupil handle appears in `OneChildEntry` records from **2+ distinct teachers** within **5 calendar days**

```ts
interface ChampionAlert {
  id: string;
  schoolId: string;
  triggeredAt: string;
  triggerType: "free_text" | "safeguarding" | "pattern";
  pupilHandle?: string;
  context: string;                  // the response that triggered, sanitised
  marks: SynodalMark[];
  status: "open" | "reviewed" | "actioned";
  championReadBy?: string;          // teacher ID of Champion who has acknowledged
  readByDeadline: string;           // submittedAt + 24h
}
```

The Champion sees alerts in a dedicated view. The teacher sees a small confirmation that "a leader will read this within 24 hours" — no more, no less.

### 4.3 Sentiment threshold (free-text triage)

Use a lightweight Gemini prompt (`gemini-2.5-flash`) to classify free-text into one of: `routine | noticing | concerned | alarmed`. Anything `concerned` or `alarmed` triggers a Champion alert even if the question wasn't `triggersChampion: true`.

```ts
// src/services/triage.ts  (NEW)
export async function triageFreeText(text: string): Promise<"routine"|"noticing"|"concerned"|"alarmed"> {
  const ai = new GoogleGenAI({});
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Classify the following teacher remark for pastoral concern level.
Respond with EXACTLY ONE of: routine, noticing, concerned, alarmed.
Caribbean teacher context. A remark is "concerned" if it suggests a child or staff member is unsafe, hungry, neglected, withdrawn, or in distress. "Alarmed" only for explicit safeguarding language.

Remark: "${text}"`,
  });
  const label = res.text.trim().toLowerCase();
  return ["routine","noticing","concerned","alarmed"].includes(label) ? label as any : "routine";
}
```

---

## 5. POUI Micro-Move replacement

The existing tip generation is replaced. After a Pulse is submitted, the platform generates a single Pastoral Micro-Move and shows it as the day's "Daily Read" surface.

### 5.1 The prompt

```ts
// src/services/poui.ts  (NEW or REPLACE existing tip generator)
export async function generateMicroMove(pulse: {
  responses: Array<{ question: string; answer: string; mark: SynodalMark }>;
  oneChild?: OneChildEntry;
  triageLabel: "routine"|"noticing"|"concerned"|"alarmed";
  termContext: string;     // e.g. "T2 week 6, SBA window approaching"
}): Promise<{ microMove: string; followUp?: string; }> {
  const ai = new GoogleGenAI({});
  const systemPrompt = `You are POUI — a coaching voice for Caribbean Catholic teachers, named for the Poui tree whose yellow blossoms burst into colour precisely when conditions are hardest.

Your job is to give the teacher ONE pastoral micro-move they can use tomorrow.

RULES:
- ONE sentence. Two at most. Never a paragraph.
- Caribbean register. Patois acceptable where natural. No British education jargon.
- Concrete and small — minutes, not weeks.
- Walks alongside the teacher. Never preaches. Never starts with "Try to..." or "Have you considered...".
- If the teacher is tired, your move respects that. Don't add to their load.
- If safeguarding is involved, your last line acknowledges that the Champion has been told. Do not give safeguarding advice yourself.
- No literature reviews. No bullet points. No "research suggests".`;

  const userPrompt = `Today's Pulse:
${pulse.responses.map(r => `- ${r.question} [${r.mark}]: ${r.answer}`).join("\n")}
${pulse.oneChild ? `\nOne Child noted: ${pulse.oneChild.pupilHandle} — ${pulse.oneChild.notedFor}` : ""}
${pulse.triageLabel !== "routine" ? `\nTriage: ${pulse.triageLabel}` : ""}
Context: ${pulse.termContext}

Generate the Micro-Move.`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
  });
  const microMove = res.text.trim();
  return { microMove };
}
```

### 5.2 Fallback

If the Gemini call fails (offline, quota, etc.), fall back to a curated bank of ~30 Caribbean-register Micro-Moves keyed by `(domain, mark, triage)`. Store these in `src/data/fallbackMicroMoves.ts`. Examples:

```ts
{ domain: "wellness", mark: "R", triage: "noticing",
  text: "Tomorrow's first ten minutes — water, windows, a song they choose. Mark a register before, not after." }
{ domain: "curriculum", mark: "D", triage: "routine",
  text: "20-minute Friday team-teach. Same problem, two approaches, ten-minute debrief." }
```

---

## 6. The Weekly Bridge

Every Friday at 16:00 (or whatever local time the school configures), generate a **Bridge digest** with two versions per school: leader and teacher.

### 6.1 Leader version (one per school)

```
SYNODAL READ OF THE WEEK
[Which Mark is currently hollow? Which is overflowing? Why?]

CHAMPION ATTENTION
[Pupils currently on the Watchlist; new this week.]

BSC IMPLICATION
[For each pillar, one sentence on what this week's Pulse data implies for status.]
```

### 6.2 Teacher version (one per teacher)

```
WHAT YOUR WEEK REVEALED
[Their participation, the Marks they touched most, anonymised pupil mentions.]

WHAT NEXT WEEK MIGHT HOLD
[Term context + targeted POUI suggestion.]

ONE SENTENCE TO TAKE HOME
[A reflection — never preachy, always Caribbean register.]
```

Both versions are generated via Gemini using the week's `PulseRollup`. Store in `weeklyBridges` table (or localStorage shape). Surface via:

- Leader: a `/dashboard/bridge` route in the principal's view
- Teacher: a once-per-week notification in the teacher's app, with the digest as a single screen

---

## 7. Dashboard export → BSC template

The PowerPoint dashboard template (`BSC_Pastoral_Pulse_Template.pptx`) consumes a JSON contract per school per cycle. Implement an export endpoint that produces it:

```ts
// src/services/bscExport.ts  (NEW)
interface BSCExport {
  schoolName: string;
  sdpCycle: string;
  generatedAt: string;
  studentsEnrolled: number;
  teachingStaff: number;
  seaAverage: number;
  sbmCurriculum: number;
  sbmStudentServices: number;
  sbmCommunity: number;
  pulseStatus: {
    participationPct: number;
    onWatchlist: number;
    avgStreak: number;
  };
  pillars: Array<{
    pillar: BSCPillar;
    objectives: Array<{
      label: string;
      baseline: string;
      target: string;
      mark: SynodalMark;
      status: 1 | 2 | 3 | 4;
    }>;
    pulseFeed: { summary: string; signal: string };
    microMove: string;
    qasIndicators: string[];
  }>;
  watchlist: Array<{
    pupilHandle: string;
    mentions: string;       // e.g. "3 staff · 4 days"
    pattern: string;
    days: string;
    mark: SynodalMark;
    status: string;
  }>;
  weeklyBridge: { leader: string; teacher: string };
}
```

A standalone script (not in this repo, but written separately) consumes this JSON and populates the .pptx using `python-pptx` or similar. For now, this spec defines the contract.

---

## 8. Migration & rollout

This is significant work. Sequence it like this:

| Phase | Days | Scope |
|------|------|-------|
| 1 | 1–5  | Synodal types + tagging the existing question bank. MarkBadge component. No behaviour change yet. |
| 2 | 6–10 | OneChildEntry + ChampionWatchlist page + SafeguardingButton. Champion alert queue (localStorage). |
| 3 | 11–15 | Replace tip engine with POUI Micro-Move. Fallback bank. Triage pipeline. |
| 4 | 16–20 | BSC rollup + export contract. Dashboard JSON tested against the .pptx template. |
| 5 | 21–25 | Weekly Bridge digest generator (leader + teacher). |
| 6 | 26–30 | Polish: visual QA, mobile, offline behaviour, two-minute contract audit. |

The two-minute teacher contract is the constant. At every phase, run a stopwatch through a Pulse run on a mid-range Android. If it exceeds 120 seconds, the Pulse is the problem, not the teacher.

---

## 9. What does NOT change

- The PWA shell, Service Worker, offline queueing — keep as is.
- Local-first persistence — backend can come later; the architecture above works against localStorage.
- Streak / points / perks gamification — leave it alone for now. The council brief did not ask for changes here.
- Voice mode — keep. Useful for accessibility and the Tuesday-morning lens.
- The teacher-facing brand "EduTrend" — preserve. The Pastoral Pulse is the *layer*, not the *replacement*.

---

## 10. Acceptance criteria

The refactor is done when:

1. Every question in the live Pulse carries a Mark, and the badge is visible to the teacher.
2. A teacher can submit a One Child entry without leaking a real name (the validator enforces it).
3. A Champion sees the Watchlist within 24 hours of a pattern emerging across staff.
4. A free-text response containing distress language triggers an alert, even on questions not flagged `triggersChampion`.
5. The Daily Read surface is replaced by a Micro-Move generated from today's Pulse, in Caribbean register, in one or two sentences.
6. The Friday Bridge digest is generated and accessible to leader and teacher in different views.
7. The BSC export JSON validates against the contract in § 7 and successfully populates the dashboard template's placeholders.
8. The two-minute teacher contract holds. If a Pulse run takes longer, the platform shows the teacher how it slipped — not the other way around.

---

*Education for Change. Bridges, not data exhaust.*
