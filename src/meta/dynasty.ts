import type { Library } from "../engine/library";
import { advisorPool } from "../engine/state";
import type { Inheritance } from "../engine/types";
import { HISTORY_ORDER } from "./histories";
import { LEGACY_FLAGS } from "./legacies";
import { firstTermDue } from "./objectives";
import type { MetaState, RunRecord } from "./types";

/**
 * A line of runs (BACKLOG-10 phase 63): a run can take over the country the last one left,
 * rather than start fresh. What it takes over is decided here, from the record the profile
 * kept of the last run, and played by the engine.
 *
 * Measured before this: a competent run leaves eight or nine legacies, and most of them are
 * about the reign rather than the country. Of the rest, a run left two or more in 99% of runs,
 * mostly the answers to its questions, then its stories (the ring, the long ship, the port).
 * A legacy alone moved nothing a bot measured, except one: the abolished vote, under which a
 * run reached the finale three times in four rather than 97 in 100. The lean is what a line
 * feels, and the legacies are what it reads.
 */

/**
 * Legacies of the reign, not the country: how it governed (its habits, its cheating, its broken
 * promises and campaign pledges, the honours it sold) and what happened to it (a lost count, a
 * won one, an heir named). And the abolished vote, which would change the rules of the whole
 * run it was handed to and make three promises moot or free.
 */
export const RUN_BOUND: ReadonlySet<string> = new Set([
  "elections_abolished",
  "cheated_election",
  "counted_late_boxes",
  "dirty_politics",
  "took_the_skim",
  "buried_the_audit",
  "honours_sold",
  "habit_skim",
  "habit_bend",
  "habit_clamp",
  "broke_mandate",
  "broke_balance",
  "broke_inquiry",
  "broke_homes",
  "broke_taxes",
  "lost_office",
  "won_it_back",
  "heir_named",
]);

/** Whether a legacy is the country's, and can be handed on. */
export function inheritable(flag: string): boolean {
  return LEGACY_FLAGS.has(flag) && !RUN_BOUND.has(flag);
}

/**
 * What a run taking over from this one inherits: the lean of the band it ended in, its biggest
 * legacies in history's order, and its rival, whose standing starts halfway back from where the
 * last reign left it.
 */
export function inheritanceFrom(lib: Library, record: RunRecord): Inheritance {
  const cfg = lib.config;
  const legacies = HISTORY_ORDER.filter((f) => record.legacies.includes(f) && inheritable(f)).slice(0, cfg.inheritLegacies);
  // A rival the deck no longer has for this side is dealt fresh, as a new run's would be.
  const rival = record.rival && advisorPool(lib, cfg.rivalRole, record.align).some((a) => a.id === record.rival) ? record.rival : null;
  return {
    band: record.band,
    line: (record.line ?? 1) + 1,
    legacies,
    rival,
    rivalStanding: Math.round((cfg.rivalStart + (record.rivalStanding ?? cfg.rivalStart)) / 2),
  };
}

/**
 * The last run a new one can take over from, or null. A profile still on its first term plays
 * that first; after it, the last run finished, whatever it was, is the country there is.
 */
export function takeOverFrom(meta: Pick<MetaState, "history" | "endings">): RunRecord | null {
  if (firstTermDue(meta)) return null;
  return meta.history[0] ?? null;
}

/** The reign of its line a run was: 1 for a fresh start. */
export function lineOf(record: Pick<RunRecord, "line">): number {
  return record.line ?? 1;
}
