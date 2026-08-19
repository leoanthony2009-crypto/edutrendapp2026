// Demo pulse series matching the prototype: fixed history blended with
// today's collated submissions. Real data comes from the server rollup
// (PASTORAL_PULSE_SPEC.md §4.1) once the backend lands.
export function todayScore(todayAvg: number | null): number {
  return todayAvg !== null ? Math.round((73 + todayAvg) / 2) : 73;
}

export function series7(todayAvg: number | null): number[] {
  return [64, 66, 61, 69, 71, 68, todayScore(todayAvg)];
}

export function series30(todayAvg: number | null): number[] {
  return [58, 62, 60, 65, 63, 67, 64, 66, 61, 69, 71, todayScore(todayAvg)];
}

export function seriesTerm(todayAvg: number | null): number[] {
  return [52, 55, 60, 57, 63, 66, 64, 70, 68, 72, 71, todayScore(todayAvg)];
}

export function pulseDelta(todayAvg: number | null): number {
  const d7 = series7(todayAvg);
  return d7[6] - d7[5];
}

export function pulseState(delta: number): "LIFTING" | "STEADY" | "NEEDS ATTENTION" {
  return delta >= 2 ? "LIFTING" : delta <= -2 ? "NEEDS ATTENTION" : "STEADY";
}
