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

/**
 * The first daily the game dealt, which is #1 (BACKLOG-5 phase 38). Days are numbered from
 * it so a group can say which daily they played in a word rather than a link: *Rule or
 * Drool #412*. Moving it renumbers every daily anyone has already shared.
 */
export const FIRST_DAILY = "2026-09-21";

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a `YYYY-MM-DD` key, or NaN for anything that is not a day. */
export function dayIndex(day: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return NaN;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Date.UTC carries 2026-02-30 over into March; a key that does not come back is not a day.
  return new Date(t).toISOString().slice(0, 10) === day ? t / DAY_MS : NaN;
}

export function dayKey(index: number): string {
  return new Date(index * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The daily dealt on `day` is #n. A day before the first daily has no number: no daily was
 * dealt then, and a phone whose clock has lost its place says it is 1970.
 */
export function dailyNumber(day: string): number | null {
  const n = dayIndex(day) - dayIndex(FIRST_DAILY) + 1;
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export interface Streak {
  /** Days in a row up to today, or up to yesterday while today's daily is still there to play. */
  current: number;
  /** The most days in a row, ever. */
  best: number;
}

/**
 * Days in a row with a daily played to its end. A streak stays alive through today while
 * today's daily is still there to play, and a missed day ends it. Days are the daily's own:
 * UTC days, so a streak turns over when the daily does.
 */
export function streakOf(dailies: readonly { day: string }[], today: string): Streak {
  const days = new Set(dailies.map((d) => dayIndex(d.day)).filter(Number.isFinite));
  let best = 0;
  for (const d of days) {
    if (days.has(d - 1)) continue; // counted from the first day of its run of days
    let n = 1;
    while (days.has(d + n)) n++;
    best = Math.max(best, n);
  }
  const t = dayIndex(today);
  const end = days.has(t) ? t : days.has(t - 1) ? t - 1 : null;
  let current = 0;
  if (end !== null) while (days.has(end - current)) current++;
  return { current, best };
}

/** `YYYY-MM` of a day key. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** The month `by` months after `month` (before, if negative), as `YYYY-MM`. */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const at = new Date(Date.UTC(y, m - 1 + by, 1));
  return at.toISOString().slice(0, 7);
}

/** Every day of a `YYYY-MM` month, as day keys, first to last. */
export function daysOfMonth(month: string): string[] {
  const first = dayIndex(`${month}-01`);
  const next = dayIndex(`${shiftMonth(month, 1)}-01`);
  const out: string[] = [];
  for (let i = first; i < next; i++) out.push(dayKey(i));
  return out;
}

/** Monday 0 to Sunday 6, for laying a month out in weeks. */
export function weekdayOf(day: string): number {
  // 1970-01-01 was a Thursday, day 3 of a week that starts on a Monday.
  return (((dayIndex(day) + 3) % 7) + 7) % 7;
}
