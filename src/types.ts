// Core Bloom types — data architecture per PASTORAL_PULSE_SPEC.md.

export type Role = "student" | "teacher" | "leader";

export type Screen =
  | "today"
  | "trends"
  | "pulse"
  | "hot"
  | "profile"
  | "manage"
  | "builder";

// Synodal Marks (spec §2)
export type SynodalMark = "R" | "L" | "D" | "SE";

export const SYNODAL_MARKS: Record<
  SynodalMark,
  { label: string; color: string; description: string }
> = {
  R: { label: "Relating", color: "#C8A951", description: "Whose voice was present, and whose was not." },
  L: { label: "Listening", color: "#4A8AD0", description: "What the school was being told and may not have heard." },
  D: { label: "Discerning", color: "#5BAA70", description: "What the teacher noticed and named." },
  SE: { label: "Self-Emptying", color: "#8E6FB6", description: "What the school absorbs without complaint." },
};

// BSC pillars (spec §2)
export type BSCPillar = "AE" | "SD" | "TL" | "CS";

export interface PulseQuestion {
  id: number;
  theme: string; // student themes ("Safety", …), teacher Synodal Marks, leader themes
  text: string;
  /** null → free text (rendered as a textarea; DESIGN_REVIEW.md P1-4) */
  opts: string[] | null;
  /** Options ordered worst→best rather than best→worst */
  reverse?: boolean;
  /** 1–5 scale where the LAST option is best */
  scale?: boolean;
  /** Unscored diagnostic choice (leader attention/barrier questions) */
  neutral?: boolean;
  /** Student weekly reflection question */
  weekly?: boolean;
  /** Free text routes to the Pastoral Champion */
  champion?: boolean;
}

export type AnswerValue = number | string;

export interface ChampionAlert {
  id: string;
  triggeredAt: string;
  triggerType: "free_text" | "safeguarding" | "pattern";
  /** Sanitised excerpt — never a pupil name by convention */
  context: string;
  triage: TriageLabel;
  status: "open" | "reviewed" | "actioned";
  readByDeadline: string; // triggeredAt + 24h
}

export type TriageLabel = "routine" | "noticing" | "concerned" | "alarmed";

export interface MySurvey {
  id: string;
  title: string;
  audience: string;
  qCount: number;
  responses: number;
  launchedAt: string;
}

export interface BuilderQuestion {
  id: number;
  text: string;
  opts: string[] | null;
}

export interface PersistedState {
  firstLaunchDone: boolean;
  role: Role;
  banks: Record<Role, PulseQuestion[]>;
  nextId: number;
  answers: Record<string, AnswerValue>;
  /** dateKey per role of the last completed pulse */
  submittedOn: Record<Role, string | null>;
  todayAvg: number | null;
  pulsesCompleted: Record<Role, number>;
  mySurveys: Record<Role, MySurvey[]>;
  builderQs: BuilderQuestion[];
  builderNextId: number;
  moveTried: boolean;
  moveSaved: boolean;
  bridgeDigest: boolean;
  championAlerts: ChampionAlert[];
  streak: number;
}
