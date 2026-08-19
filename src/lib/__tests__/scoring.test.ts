import { describe, expect, it } from "vitest";
import { collatePulse, scoreAnswer } from "../scoring";
import type { PulseQuestion } from "../../types";

const positiveFirst: PulseQuestion = {
  id: 1,
  theme: "Safety",
  text: "Did you feel safe in school today?",
  opts: ["Yes", "Mostly", "Not really", "No"],
};

const withPnts: PulseQuestion = {
  id: 6,
  theme: "Peer treatment",
  text: "Did another pupil make you feel unsafe or uncomfortable?",
  opts: ["No", "A little", "Yes", "Prefer not to say"],
  reverse: true,
};

const scale: PulseQuestion = {
  id: 101,
  theme: "SE",
  text: "Was your classroom workable today?",
  opts: ["Not at all", "Barely", "Somewhat", "Mostly", "Fully"],
  scale: true,
};

const neutral: PulseQuestion = {
  id: 201,
  theme: "Attention",
  text: "What concern is taking the most leadership attention?",
  opts: ["Safety", "Attendance"],
  neutral: true,
};

const freeText: PulseQuestion = { id: 12, theme: "Agency", text: "Reflection", opts: null };

describe("scoreAnswer", () => {
  it("scores positive-first options with best answer = 1", () => {
    expect(scoreAnswer(positiveFirst, 0)).toBe(1);
    expect(scoreAnswer(positiveFirst, 3)).toBe(0);
    expect(scoreAnswer(positiveFirst, 1)).toBeCloseTo(2 / 3);
  });

  it('NEVER scores "Prefer not to say" (DESIGN_REVIEW P1-3)', () => {
    const pntsIndex = withPnts.opts!.indexOf("Prefer not to say");
    expect(scoreAnswer(withPnts, pntsIndex)).toBeNull();
  });

  it("scores remaining options of a Prefer-not-to-say question over the reduced range", () => {
    // "No" (best) → 1; "Yes" (worst scorable) → 0
    expect(scoreAnswer(withPnts, 0)).toBe(1);
    expect(scoreAnswer(withPnts, 2)).toBe(0);
  });

  it("scores 1-5 scales worst-first", () => {
    expect(scoreAnswer(scale, 0)).toBe(0);
    expect(scoreAnswer(scale, 4)).toBe(1);
  });

  it("skips neutral diagnostic questions and free text", () => {
    expect(scoreAnswer(neutral, 0)).toBeNull();
    expect(scoreAnswer(freeText, 0)).toBeNull();
  });
});

describe("collatePulse", () => {
  const key = (q: PulseQuestion) => `student:${q.id}`;

  it("averages only scorable answers to 0-100", () => {
    const avg = collatePulse([positiveFirst, scale], { "student:1": 0, "student:101": 4 }, key);
    expect(avg).toBe(100);
  });

  it("excludes Prefer-not-to-say answers from the average entirely", () => {
    const pnts = withPnts.opts!.indexOf("Prefer not to say");
    const withRefusal = collatePulse(
      [positiveFirst, withPnts],
      { "student:1": 0, "student:6": pnts },
      key
    );
    expect(withRefusal).toBe(100); // refusal did not drag the average down

    const prototypeBug = collatePulse([withPnts], { "student:6": pnts }, key);
    expect(prototypeBug).toBeNull(); // nothing scorable at all
  });

  it("returns null when nothing is scorable", () => {
    expect(collatePulse([freeText], { "student:12": "hello" }, key)).toBeNull();
  });
});
