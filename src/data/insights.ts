// Insight/demo content from the design prototype. In production these feeds
// come from collated pulse data and a content service that stores citations
// with each item (DESIGN_REVIEW.md P2-14); shapes below match that contract.

export const POUI_GPT_URL =
  "https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0";

export interface HotCard {
  cat: string;
  heat: string;
  heatColor: string;
  title: string;
  body: string;
  bar: string;
  why: string;
}

export const HOT_CARDS: HotCard[] = [
  {
    cat: "SAFETY & PEERS",
    heat: "92% heat",
    heatColor: "#D9634E",
    title: "Break-time hotspots",
    body: "Pupils in Forms 2–3 report feeling least safe around break times, near the back corridor.",
    bar: "linear-gradient(90deg,#E19A45,#D9634E)",
    why: "Surfaced: rising 3 weeks · 20+ voices · matches leader Pulse concern",
  },
  {
    cat: "LEARNING PRESSURE",
    heat: "74% heat",
    heatColor: "#C8A951",
    title: "SBA stress climbing",
    body: "Form 5 pupils reporting heavy days doubled since the SBA window opened.",
    bar: "linear-gradient(90deg,#C8A951,#E19A45)",
    why: "Surfaced: new this fortnight · seasonal pattern likely",
  },
  {
    cat: "POSITIVE SIGNAL",
    heat: "steady",
    heatColor: "#5BAA70",
    title: "Buddy scheme working",
    body: "“Someone made my day better” is up 11 points among Form 1 since buddies launched.",
    bar: "#5BAA70",
    why: "Surfaced: consistent 5 weeks · worth sharing on the Bridge",
  },
];

export interface MicroShot {
  title: string;
  concept: string;
  tryThis: string;
  researchLocal: string;
  researchWider: string;
}

export const MICRO_SHOTS: MicroShot[] = [
  {
    title: "Break-time hotspots",
    concept:
      "Pupils feel least safe where adult presence is thinnest. Visibility, not surveillance, is what changes how a corridor feels.",
    tryThis:
      "Stand at the back corridor for the first five minutes of break with a cup of tea. Presence, not patrol.",
    researchLocal:
      "T&T: Ministry of Education school-safety reviews and UWI St. Augustine studies consistently locate peer incidents in low-supervision spaces (corridors, stairwells, back yards) at unstructured times.",
    researchWider:
      "Wider: Astor & Benbenishty's school-violence research shows most incidents cluster in “unowned” spaces — and that visible, relational adult presence (not patrols) reduces them.",
  },
  {
    title: "SBA stress climbing",
    concept:
      "SBA pressure spikes are seasonal and predictable. Naming the pressure out loud reduces the shame of struggling with it.",
    tryThis:
      "Open one class with: “SBA season is heavy for everyone — what is one thing that would make this week lighter?”",
    researchLocal:
      "T&T: UWI School of Education research in Caribbean Curriculum documents SBA workload as a leading stressor for CSEC students and teachers during the submission window.",
    researchWider:
      "Wider: test-anxiety research (e.g. Putwain) finds that normalising pressure and breaking work into named, small steps measurably lowers assessment stress.",
  },
  {
    title: "Buddy scheme working",
    concept:
      "Belonging grows fastest through one reliable peer connection — structure creates the chance, warmth does the rest.",
    tryThis:
      "Ask one buddy pair to show a new pupil their favourite spot in school this week.",
    researchLocal:
      "T&T: local transition studies report Form 1 pupils naming “one friend who knows my name” as the strongest predictor of settling in by end of first term.",
    researchWider:
      "Wider: EEF evidence on peer mentoring shows structured buddy schemes reliably improve belonging and attendance, with the largest gains for new and transitioning pupils.",
  },
];

export const NAT_REGIONS = [
  { label: "North", v: 3480 },
  { label: "Central", v: 4120 },
  { label: "South", v: 2890 },
  { label: "East", v: 1440 },
  { label: "Tobago", v: 520 },
];

export const PERKS = [
  { title: "CXC / SBA marking toolkit", sub: "Free download · rubric templates + timers" },
  { title: "2GB data top-up", sub: "For your 10-day pulse streak · any local carrier" },
  { title: "NALIS extended borrowing", sub: "Teacher pass · 6 items, 6 weeks" },
  { title: "Wellness Wednesday voucher", sub: "Early-close cover for one afternoon this term" },
];

export const DOMAINS = [
  { label: "Safety & peers", v: 67, d: -3 },
  { label: "Belonging", v: 72, d: 4 },
  { label: "Trusted adults", v: 61, d: 1 },
  { label: "Emotional load", v: 58, d: -2 },
  { label: "Engagement", v: 70, d: 2 },
  { label: "Learning", v: 64, d: 0 },
  { label: "Voice & fairness", v: 69, d: 5 },
  { label: "Home context", v: 62, d: -1 },
];

export const THEMES = [
  { label: "Break-time safety (Forms 2–3)", sub: "Safety · 44 mentions", w: 84, color: "#D9634E" },
  { label: "SBA pressure", sub: "Learning pressure · 36 mentions", w: 68, color: "#C8A951" },
  { label: "Buddy scheme lifting belonging", sub: "Positive signal · 29 mentions", w: 55, color: "#5BAA70" },
];

export const UNHEARD = [
  { label: "Form 3 boys", pct: 38, color: "#D9634E" },
  { label: "New transfers", pct: 46, color: "#E19A45" },
  { label: "Form 1", pct: 72, color: "#5BAA70" },
  { label: "Form 5 (SBA term)", pct: 54, color: "#C8A951" },
];

export const SCHOOL_NAME = "St. Joseph's RC Secondary";

export const PROFILES = {
  student: { name: "Student F2-104", sub: "Form 2 · handle, never your name", init: "F2" },
  teacher: { name: "M. Persaud", sub: "Form teacher · 12-day streak", init: "MP" },
  leader: { name: "Sr. A. Joseph", sub: "Principal · Pastoral Champion", init: "AJ" },
} as const;

export const ROLE_CHIPS = {
  student: "Student · Form 2",
  teacher: "Teacher · Form 2",
  leader: "Leader · Principal",
} as const;
