import { useMemo, useState } from "react";
import { useStore, dateKey } from "../lib/store";
import type { Screen } from "../types";
import { rotateStudentBank, rotationSeed } from "../lib/rotation";
import { collatePulse } from "../lib/scoring";
import { SYNODAL_MARKS } from "../types";
import { ThemeBadge, Meter } from "../components/ui";
import { BloomAnimated } from "../components/BloomLogo";

const TITLES = {
  student: "Your Voice Today",
  teacher: "Daily Pulse",
  leader: "Leader Pulse · weekly",
} as const;

const FOOTNOTES = {
  student: 'Anonymous · "prefer not to say" is always okay',
  teacher: "Two-minute contract · anonymous by design",
  leader: "Compared with pupil voice, never assumed correct",
} as const;

export function Pulse({ go }: { go: (s: Screen) => void }) {
  const { state, dispatch } = useStore();
  const role = state.role;
  const [qi, setQi] = useState(0);
  const canEdit = role !== "student";

  const qs = useMemo(() => {
    const bank = state.banks[role];
    return role === "student" ? rotateStudentBank(bank, rotationSeed()) : bank;
  }, [state.banks, role]);

  const submittedToday = state.submittedOn[role] === dateKey();
  const bankEmpty = qs.length === 0;
  const done = submittedToday || (!bankEmpty && qi >= qs.length);

  if (bankEmpty) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-10 pt-[90px] text-center">
        <div className="text-[28px] text-gold" aria-hidden>✿</div>
        <h2 className="font-display text-[19px] font-bold text-green">Today's voice is still gathering</h2>
        <p className="text-[12.5px] leading-relaxed text-meta">
          There are no questions in this carousel yet. Add one to begin.
        </p>
        {canEdit && (
          <button
            onClick={() => go("manage")}
            className="mt-1.5 rounded-row bg-green px-[22px] py-[11px] text-[13px] font-extrabold text-on-dark"
          >
            Add questions
          </button>
        )}
      </div>
    );
  }

  if (done) {
    const respLine = `${165 + 1} voices`;
    const copy = {
      student: {
        title: "Heard. Thank you.",
        body: "Your voice joined 165 others today. Adults see patterns, never your name.",
        cta: "See Today's Insights",
      },
      teacher: {
        title: "Thank you",
        body: `Your voice joined ${respLine} today. It is now collated into Today's Insights and Trends.`,
        cta: "See Today's Insights",
      },
      leader: {
        title: "Logged for the Bridge",
        body: "Your answers will sit beside pupil voice in Friday's Bridge digest — comparing perception with experience.",
        cta: "Back to leadership view",
      },
    }[role];
    return (
      <div className="flex flex-col items-center gap-3 px-8 pt-14 text-center">
        <BloomAnimated size={76} />
        <h2 className="font-display text-[26px] font-extrabold text-green">{copy.title}</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#6B6F5F]">{copy.body}</p>
        <button
          onClick={() => go("today")}
          className="mt-2 rounded-input bg-green px-[26px] py-3 text-sm font-extrabold text-on-dark"
        >
          {copy.cta}
        </button>
        {/* One pulse per day is real (DESIGN_REVIEW.md P3-16); same-day answers stay editable. */}
        <button
          onClick={() => {
            dispatch({ type: "reopenPulse", role });
            setQi(0);
          }}
          className="min-h-[44px] text-xs text-gold-ink underline underline-offset-2"
        >
          Change today's answers
        </button>
      </div>
    );
  }

  const q = qs[Math.min(qi, qs.length - 1)];
  const isChoice = Array.isArray(q.opts);
  const ans = state.answers[`${role}:${q.id}`];
  const canNext = isChoice ? typeof ans === "number" : true;
  const markInfo = role === "teacher" ? SYNODAL_MARKS[q.theme as keyof typeof SYNODAL_MARKS] : undefined;

  const finish = () => {
    const avg = collatePulse(qs, state.answers, (x) => `${role}:${x.id}`);
    dispatch({ type: "finishPulse", role, qs, avg });
    setQi(qs.length);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between px-[18px] pt-4">
        <h2 className="font-display text-[15px] font-bold text-green">{TITLES[role]}</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gold-ink" aria-label={`Question ${qi + 1} of ${qs.length}`}>
            {qi + 1} / {qs.length}
          </span>
          {canEdit && (
            <button
              onClick={() => go("manage")}
              className="min-h-[44px] text-[11px] font-bold text-green underline underline-offset-2"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="mx-[18px] mt-3">
        <Meter
          value={(qi / Math.max(1, qs.length)) * 100 + 6}
          color="#C8A951"
          track="#EDE6D3"
          height={5}
          label={`Progress: question ${qi + 1} of ${qs.length}`}
        />
      </div>

      <div className="px-5 pt-6">
        <ThemeBadge
          theme={q.theme}
          title={markInfo ? `${markInfo.label} — ${markInfo.description}` : undefined}
        />
        <h3 className="mt-3 font-display text-[23px] font-bold leading-[1.28] tracking-tight [text-wrap:pretty]">
          {q.text}
        </h3>
      </div>

      {isChoice ? (
        <div role="radiogroup" aria-label={q.text} className="flex flex-col gap-[9px] px-[18px] pt-[22px]">
          {q.opts!.map((label, i) => {
            const sel = ans === i;
            return (
              <button
                key={label}
                role="radio"
                aria-checked={sel}
                onClick={() => dispatch({ type: "answer", role, questionId: q.id, value: i })}
                className={`flex min-h-[48px] items-center gap-[11px] rounded-input border-[1.5px] px-[15px] py-[13px] text-left transition-colors ${
                  sel ? "border-green bg-green text-on-dark" : "border-border-strong bg-white text-ink"
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                {sel && <span className="ml-auto text-[13px] font-extrabold" aria-hidden>✓</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-[18px] pt-[22px]">
          {/* Reflection answers get room to breathe (DESIGN_REVIEW.md P1-4). */}
          <label htmlFor={`ft-${q.id}`} className="sr-only">
            {q.text}
          </label>
          <textarea
            id={`ft-${q.id}`}
            value={typeof ans === "string" ? ans : ""}
            onChange={(e) => dispatch({ type: "answer", role, questionId: q.id, value: e.target.value })}
            placeholder={
              role === "student" ? "Only if you want to — a word or a sentence" : "Type here — a word or a sentence"
            }
            maxLength={400}
            className="min-h-[110px] w-full resize-y rounded-input border-[1.5px] border-border-strong bg-white px-[15px] py-3.5 text-sm text-ink outline-none focus:border-green"
          />
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="text-[11px] text-meta">
              {role === "student"
                ? "Optional. If this signals worry, only your Pastoral Champion reads it."
                : "Free text signalling concern is read by your Pastoral Champion within 24 hours."}
            </p>
            <span className="flex-none text-[10px] text-meta" aria-hidden>
              {typeof ans === "string" ? ans.length : 0}/400
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-[9px] px-[18px] pt-5">
        <button
          onClick={() => setQi(Math.max(0, qi - 1))}
          disabled={qi === 0}
          className="rounded-input border-[1.5px] border-border-strong px-[18px] py-[13px] text-[13px] font-bold text-meta-faint disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (!canNext) return;
            qi === qs.length - 1 ? finish() : setQi(qi + 1);
          }}
          aria-disabled={!canNext}
          className={`flex-1 rounded-input py-[13px] text-center text-sm font-extrabold transition-colors ${
            canNext ? "bg-gold text-charcoal" : "bg-sand text-meta"
          }`}
        >
          {canNext ? (qi === qs.length - 1 ? "Finish" : "Next →") : "Pick an answer"}
        </button>
      </div>

      <p className="pb-4 pt-3 text-center text-[11px] text-meta">{FOOTNOTES[role]}</p>
    </div>
  );
}
