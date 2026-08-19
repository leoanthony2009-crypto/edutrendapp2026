import { describe, expect, it } from "vitest";
import { defaultState, reducer, dateKey } from "../store";
import { DEFAULT_BANKS } from "../../data/questionBanks";

describe("finishPulse", () => {
  it("increments the Survey Builder unlock counter for teachers/leaders, never students", () => {
    const s0 = defaultState();
    const t = reducer(s0, { type: "finishPulse", role: "teacher", qs: [], avg: 80 });
    expect(t.pulsesCompleted.teacher).toBe(s0.pulsesCompleted.teacher + 1);
    const st = reducer(s0, { type: "finishPulse", role: "student", qs: [], avg: 80 });
    expect(st.pulsesCompleted.student).toBe(s0.pulsesCompleted.student);
  });

  it("marks the role submitted for today only", () => {
    const s = reducer(defaultState(), { type: "finishPulse", role: "student", qs: [], avg: null });
    expect(s.submittedOn.student).toBe(dateKey());
    expect(s.submittedOn.teacher).toBeNull();
  });

  it("queues a Champion alert UNCONDITIONALLY for non-empty champion-flagged free text", () => {
    let s = defaultState();
    const championQ = DEFAULT_BANKS.teacher.find((q) => q.champion)!;
    s = reducer(s, {
      type: "answer",
      role: "teacher",
      questionId: championQ.id,
      value: "a completely routine everyday remark",
    });
    s = reducer(s, { type: "finishPulse", role: "teacher", qs: DEFAULT_BANKS.teacher, avg: null });
    // routine text still escalates — triage annotates, never gates (AUDIT P1-1)
    expect(s.championAlerts).toHaveLength(1);
    expect(s.championAlerts[0].triggerType).toBe("free_text");
    expect(s.championAlerts[0].triage).toBe("routine");
  });

  it("does not alert for empty champion answers", () => {
    let s = defaultState();
    const championQ = DEFAULT_BANKS.teacher.find((q) => q.champion)!;
    s = reducer(s, { type: "answer", role: "teacher", questionId: championQ.id, value: "   " });
    s = reducer(s, { type: "finishPulse", role: "teacher", qs: DEFAULT_BANKS.teacher, avg: null });
    expect(s.championAlerts).toHaveLength(0);
  });
});

describe("tellALeader", () => {
  it("queues a safeguarding alert with a 24-hour read deadline", () => {
    const s = reducer(defaultState(), { type: "tellALeader", note: "please check on the yard" });
    expect(s.championAlerts).toHaveLength(1);
    const a = s.championAlerts[0];
    expect(a.triggerType).toBe("safeguarding");
    expect(a.status).toBe("open");
    const deadlineMs = new Date(a.readByDeadline).getTime() - new Date(a.triggeredAt).getTime();
    expect(deadlineMs).toBe(24 * 3600 * 1000);
  });
});

describe("survey builder", () => {
  it("launches a survey and resets the draft", () => {
    let s = defaultState();
    s = reducer(s, { type: "builderEdit", index: 0, patch: { text: "Is homework load fair?" } });
    s = reducer(s, { type: "launchSurvey", role: "teacher", title: "Homework check", audience: "My class" });
    expect(s.mySurveys.teacher[0]).toMatchObject({
      title: "Homework check",
      audience: "My class",
      qCount: 1,
      responses: 0,
    });
    expect(s.builderQs).toHaveLength(1);
    expect(s.builderQs[0].text).toBe("New question — tap to edit");
  });
});

describe("question manager", () => {
  it("edits, toggles type and removes bank questions", () => {
    let s = defaultState();
    s = reducer(s, { type: "editBankQuestion", role: "teacher", index: 0, patch: { text: "Edited" } });
    expect(s.banks.teacher[0].text).toBe("Edited");
    s = reducer(s, { type: "editBankQuestion", role: "teacher", index: 0, patch: { opts: null } });
    expect(s.banks.teacher[0].opts).toBeNull();
    const before = s.banks.teacher.length;
    s = reducer(s, { type: "removeBankQuestion", role: "teacher", index: 0 });
    expect(s.banks.teacher).toHaveLength(before - 1);
    s = reducer(s, { type: "addBankQuestion", role: "teacher" });
    expect(s.banks.teacher).toHaveLength(before);
  });
});
