import type { TriageLabel } from "../types";

/**
 * Free-text triage per PASTORAL_PULSE_SPEC.md §4.3, corrected per the audit
 * (AUDIT_REPORT.md P1-1): classification ANNOTATES an alert, it never GATES
 * one. Questions flagged `champion` create a Champion alert for any
 * non-empty answer regardless of what this returns, and no failure mode can
 * swallow an escalation.
 *
 * The spec's Gemini classifier belongs server-side (the key must not ship in
 * a client bundle); this keyword heuristic is the offline/local annotator and
 * remains the fallback once the API exists.
 */
const ALARMED = [/\bhurt (him|her|them|me|myself)\b/i, /\bafraid to go home\b/i, /\babus/i, /\bself[- ]?harm/i, /\bsuicid/i, /\bweapon\b/i, /\bthreat/i];

const CONCERNED = [/\bunsafe\b/i, /\bnot safe\b/i, /\bscared\b/i, /\bhungry\b/i, /\bno food\b/i, /\bneglect/i, /\bwithdrawn\b/i, /\bcry(ing|ies)?\b/i, /\bbully/i, /\bbullied\b/i, /\bhit (me|him|her|them)\b/i, /\bdistress/i, /\balone at home\b/i];

const NOTICING = [/\bworried\b/i, /\bworry\b/i, /\btired\b/i, /\bexhaust/i, /\bstruggl/i, /\bquiet(er)? than usual\b/i, /\bmissing class\b/i, /\bnot eating\b/i, /\bheavy\b/i];

export function triageFreeText(text: string): TriageLabel {
  const t = text.trim();
  if (!t) return "routine";
  if (ALARMED.some((re) => re.test(t))) return "alarmed";
  if (CONCERNED.some((re) => re.test(t))) return "concerned";
  if (NOTICING.some((re) => re.test(t))) return "noticing";
  return "routine";
}
