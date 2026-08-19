import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  AnswerValue,
  BuilderQuestion,
  ChampionAlert,
  PersistedState,
  PulseQuestion,
  Role,
} from "../types";
import { DEFAULT_BANKS } from "../data/questionBanks";
import { triageFreeText } from "./triage";

// Local-first persistence per PASTORAL_PULSE_SPEC.md §9. Everything the app
// stores lives under one versioned key; the reducer is the single write path
// so a future API layer can mirror actions 1:1 (see AUDIT_REPORT.md P0-4 for
// why alerts/pulses must eventually also persist server-side).
const STORAGE_KEY = "bloom:v2";

export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function defaultState(): PersistedState {
  return {
    firstLaunchDone: false,
    role: "student",
    banks: structuredClone(DEFAULT_BANKS),
    nextId: 300,
    answers: {},
    submittedOn: { student: null, teacher: null, leader: null },
    todayAvg: null,
    // Demo seed matching the prototype (teacher 9/10 shows the unlock journey;
    // server-side counter is the destination — DESIGN_REVIEW.md P2-11).
    pulsesCompleted: { student: 0, teacher: 9, leader: 12 },
    mySurveys: {
      student: [],
      teacher: [],
      leader: [
        {
          id: "s-demo-1",
          title: "Break-time supervision check",
          audience: "Whole school",
          qCount: 4,
          responses: 23,
          launchedAt: new Date().toISOString(),
        },
      ],
    },
    builderQs: [{ id: 801, text: "New question — tap to edit", opts: ["Yes", "Mostly", "Not really", "No"] }],
    builderNextId: 900,
    moveTried: false,
    moveSaved: false,
    bridgeDigest: true,
    championAlerts: [],
    streak: 6,
  };
}

function load(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function save(s: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable — the session still works in memory */
  }
}

export type Action =
  | { type: "splashDone" }
  | { type: "setRole"; role: Role }
  | { type: "answer"; role: Role; questionId: number; value: AnswerValue }
  | { type: "finishPulse"; role: Role; qs: PulseQuestion[]; avg: number | null }
  | { type: "reopenPulse"; role: Role }
  | { type: "editBankQuestion"; role: Role; index: number; patch: Partial<PulseQuestion> }
  | { type: "removeBankQuestion"; role: Role; index: number }
  | { type: "addBankQuestion"; role: Role }
  | { type: "toggleMoveTried" }
  | { type: "toggleMoveSaved" }
  | { type: "toggleBridgeDigest" }
  | { type: "tellALeader"; note: string }
  | { type: "builderEdit"; index: number; patch: Partial<BuilderQuestion> }
  | { type: "builderRemove"; index: number }
  | { type: "builderAdd" }
  | { type: "builderReset" }
  | { type: "launchSurvey"; role: Role; title: string; audience: string };

export function makeAlert(triggerType: ChampionAlert["triggerType"], context: string): ChampionAlert {
  const now = new Date();
  return {
    id: `ca_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    triggeredAt: now.toISOString(),
    triggerType,
    context: context.trim().slice(0, 400),
    triage: triageFreeText(context),
    status: "open",
    readByDeadline: new Date(now.getTime() + 24 * 3600_000).toISOString(),
  };
}

export function reducer(s: PersistedState, a: Action): PersistedState {
  switch (a.type) {
    case "splashDone":
      return { ...s, firstLaunchDone: true };
    case "setRole":
      return { ...s, role: a.role };
    case "answer":
      return { ...s, answers: { ...s.answers, [`${a.role}:${a.questionId}`]: a.value } };
    case "finishPulse": {
      // Champion escalation is UNCONDITIONAL for flagged free-text answers —
      // triage annotates severity but never gates (AUDIT_REPORT.md P1-1).
      const alerts = [...s.championAlerts];
      for (const q of a.qs) {
        if (!q.champion) continue;
        const v = s.answers[`${a.role}:${q.id}`];
        if (typeof v === "string" && v.trim()) {
          alerts.push(makeAlert("free_text", `${q.text} — ${v}`));
        }
      }
      const pulsesCompleted =
        a.role === "student"
          ? s.pulsesCompleted
          : { ...s.pulsesCompleted, [a.role]: (s.pulsesCompleted[a.role] ?? 0) + 1 };
      return {
        ...s,
        submittedOn: { ...s.submittedOn, [a.role]: dateKey() },
        todayAvg: a.avg ?? s.todayAvg,
        pulsesCompleted,
        championAlerts: alerts,
      };
    }
    case "reopenPulse":
      return { ...s, submittedOn: { ...s.submittedOn, [a.role]: null } };
    case "editBankQuestion": {
      const bank = s.banks[a.role].slice();
      bank[a.index] = { ...bank[a.index], ...a.patch };
      return { ...s, banks: { ...s.banks, [a.role]: bank } };
    }
    case "removeBankQuestion":
      return {
        ...s,
        banks: { ...s.banks, [a.role]: s.banks[a.role].filter((_, i) => i !== a.index) },
      };
    case "addBankQuestion": {
      const q: PulseQuestion = {
        id: s.nextId,
        theme: a.role === "leader" ? "Action" : "Voice",
        text: "New question — tap to edit",
        opts: ["Yes", "Mostly", "Not really", "No"],
      };
      return {
        ...s,
        banks: { ...s.banks, [a.role]: [...s.banks[a.role], q] },
        nextId: s.nextId + 1,
      };
    }
    case "toggleMoveTried":
      return { ...s, moveTried: !s.moveTried };
    case "toggleMoveSaved":
      return { ...s, moveSaved: !s.moveSaved };
    case "toggleBridgeDigest":
      return { ...s, bridgeDigest: !s.bridgeDigest };
    case "tellALeader":
      return {
        ...s,
        championAlerts: [
          ...s.championAlerts,
          makeAlert("safeguarding", a.note || "Tell-a-leader note (no text left)"),
        ],
      };
    case "builderEdit": {
      const qs = s.builderQs.slice();
      qs[a.index] = { ...qs[a.index], ...a.patch };
      return { ...s, builderQs: qs };
    }
    case "builderRemove":
      return { ...s, builderQs: s.builderQs.filter((_, i) => i !== a.index) };
    case "builderAdd":
      return {
        ...s,
        builderQs: [
          ...s.builderQs,
          { id: s.builderNextId, text: "New question — tap to edit", opts: ["Yes", "Mostly", "Not really", "No"] },
        ],
        builderNextId: s.builderNextId + 1,
      };
    case "builderReset":
      return {
        ...s,
        builderQs: [{ id: s.builderNextId, text: "New question — tap to edit", opts: ["Yes", "Mostly", "Not really", "No"] }],
        builderNextId: s.builderNextId + 1,
      };
    case "launchSurvey": {
      const survey = {
        id: `sv_${Date.now()}`,
        title: a.title.trim(),
        audience: a.audience,
        qCount: s.builderQs.length,
        responses: 0,
        launchedAt: new Date().toISOString(),
      };
      return {
        ...s,
        mySurveys: { ...s.mySurveys, [a.role]: [survey, ...(s.mySurveys[a.role] ?? [])] },
        builderQs: [{ id: s.builderNextId, text: "New question — tap to edit", opts: ["Yes", "Mostly", "Not really", "No"] }],
        builderNextId: s.builderNextId + 1,
      };
    }
    default:
      return s;
  }
}

const StoreCtx = createContext<{ state: PersistedState; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => save(state), [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
