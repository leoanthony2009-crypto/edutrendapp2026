import type { PulseQuestion, Role } from "../types";

// Question banks from the design prototype (Bloom App.dc.html), verbatim.
// Student: 12-question bank rotated 3–5/day plus a weekly reflection.
// Teacher: 5 daily questions carrying Synodal Marks. Leader: 5 weekly
// decision questions.
export const DEFAULT_BANKS: Record<Role, PulseQuestion[]> = {
  student: [
    { id: 1, theme: "Safety", text: "Did you feel safe in school today?", opts: ["Yes", "Mostly", "Not really", "No"] },
    { id: 2, theme: "Belonging", text: "Did you feel like you belonged here today?", opts: ["Yes", "Mostly", "Not really", "No"] },
    { id: 3, theme: "Trusted adult", text: "Is there an adult here you trust to talk to?", opts: ["Yes", "Maybe", "No"] },
    { id: 4, theme: "Voice", text: "Did you feel listened to today?", opts: ["Yes", "Sometimes", "No"] },
    { id: 5, theme: "Fairness", text: "Were you treated fairly today?", opts: ["Yes", "Mostly", "Not really", "No"] },
    { id: 6, theme: "Peer treatment", text: "Did another pupil make you feel unsafe or uncomfortable?", opts: ["No", "A little", "Yes", "Prefer not to say"], reverse: true },
    { id: 7, theme: "Stress", text: "How heavy did today feel?", opts: ["Light", "Okay", "Heavy", "Very heavy"], reverse: true },
    { id: 8, theme: "Learning", text: "Did today's lessons make sense to you?", opts: ["Mostly", "Some", "Hardly", "Not at all"] },
    { id: 9, theme: "Attendance", text: "How do you feel about coming back tomorrow?", opts: ["Looking forward", "Okay", "Unsure", "Don't want to"] },
    { id: 10, theme: "Home", text: "Is something outside school making learning harder right now?", opts: ["No", "A little", "Yes", "Prefer not to say"], reverse: true },
    { id: 11, theme: "Participation", text: "Did you get a fair chance to speak or ask for help today?", opts: ["Yes", "Mostly", "No"] },
    { id: 12, theme: "Agency", text: "Is there something you wish adults here understood?", opts: null, weekly: true, champion: true },
  ],
  teacher: [
    { id: 101, theme: "SE", text: "Was your classroom workable today (heat, light, space, supplies)?", opts: ["Not at all", "Barely", "Somewhat", "Mostly", "Fully"], scale: true },
    { id: 102, theme: "R", text: "How are you, in one word, today?", opts: null },
    { id: 103, theme: "D", text: "Did the lesson land?", opts: ["Not at all", "Barely", "Somewhat", "Mostly", "Fully"], scale: true },
    { id: 104, theme: "R", text: "Whose voice did you not hear today?", opts: null },
    { id: 105, theme: "L", text: "Did anything happen today that you would want a leader to know?", opts: null, champion: true },
  ],
  leader: [
    { id: 201, theme: "Attention", text: "What concern is taking the most leadership attention this week?", opts: ["Safety", "Attendance", "Behaviour", "Learning", "Wellbeing", "Staffing", "Family engagement"], neutral: true },
    { id: 202, theme: "Visibility", text: "Where do you feel your team has the least visibility right now?", opts: null },
    { id: 203, theme: "Response", text: "Are staff responding consistently when pupils raise concerns?", opts: ["Yes", "Mostly", "Inconsistently", "No"] },
    { id: 204, theme: "Barriers", text: "What is preventing earlier pastoral intervention?", opts: ["Time", "Information", "Staffing", "Confidence", "Communication", "Unclear responsibility"], neutral: true },
    { id: 205, theme: "Action", text: "What is one thing pupils are telling us that needs a leadership response this week?", opts: null, champion: true },
  ],
};

export const THEME_COLORS: Record<string, string> = {
  Safety: "#6E2B2F",
  Belonging: "#8E6FB6",
  "Trusted adult": "#295C4D",
  Voice: "#C8A951",
  Fairness: "#4A8AD0",
  "Peer treatment": "#6E2B2F",
  Stress: "#8E6FB6",
  Learning: "#5BAA70",
  Attendance: "#4A8AD0",
  Home: "#6F6A58",
  Participation: "#C8A951",
  Agency: "#295C4D",
  R: "#C8A951",
  L: "#4A8AD0",
  D: "#5BAA70",
  SE: "#8E6FB6",
  Attention: "#295C4D",
  Visibility: "#4A8AD0",
  Response: "#5BAA70",
  Barriers: "#8E6FB6",
  Action: "#C8A951",
};

export function themeColor(theme: string): string {
  return THEME_COLORS[theme] ?? "#295C4D";
}
