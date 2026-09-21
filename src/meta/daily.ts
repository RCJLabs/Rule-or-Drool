import { seedToState } from "../engine/rng";

/** UTC day key, `YYYY-MM-DD`. Everyone gets the same daily run on the same calendar day. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Deterministic seed for a day key (5.10). */
export function dailySeed(day: string): number {
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (Math.imul(h, 31) + day.charCodeAt(i)) | 0;
  return Math.abs(seedToState(h)) % 1_000_000_000;
}

export function dailySeedFor(now: Date = new Date()): { day: string; seed: number } {
  const day = todayKey(now);
  return { day, seed: dailySeed(day) };
}
