import type { Library } from "./library";
import { BANDS, type Band, type Card, type GameState, type Inheritance } from "./types";

/**
 * A run can take over the country the last one left (BACKLOG-10 phase 63): it starts leaning
 * the way the last reign ended, with a legacy or two still in force, against the rival who
 * remembers it. A fresh start is always on offer beside it, because a bad inheritance compounds.
 *
 * What a country can hand on is the profile's to say (`src/meta/dynasty.ts`); the engine takes
 * the legacies as flags, checks the shape, and plays them.
 */

/** Set from the first card of a run that took over, for the cards written for one. */
export const TOOK_OVER_FLAG = "took_over";

/** The drift a run that took over starts with: toward the band the last reign ended in. */
export function leanOf(lib: Library, band: Band): number {
  const lean = lib.config.inheritLean;
  return band === "decay" ? -lean : band === "ascent" ? lean : 0;
}

/**
 * What is wrong with an inheritance's shape, or null. Whether its rival can sit against this
 * side is `newRun`'s to check, which knows the pool.
 */
export function inheritanceProblem(lib: Library, inh: Inheritance): string | null {
  if (!BANDS.includes(inh.band)) return `an inheritance names no band: ${String(inh.band)}`;
  if (!Number.isInteger(inh.line) || inh.line < 2) return `a run that took over is at least the second of its line, not ${inh.line}`;
  if (!Array.isArray(inh.legacies) || inh.legacies.length > lib.config.inheritLegacies) return `a run takes over at most ${lib.config.inheritLegacies} legacies`;
  if (inh.legacies.some((f) => typeof f !== "string" || f === "") || new Set(inh.legacies).size < inh.legacies.length) return "an inherited legacy is named once";
  if (!Number.isInteger(inh.rivalStanding) || inh.rivalStanding < 0 || inh.rivalStanding > 100) return `a rival's standing is 0-100, not ${inh.rivalStanding}`;
  return null;
}

/** Whether a card is one that hands a run over. */
export function isHandoverCard(lib: Library, id: string): boolean {
  return BANDS.some((b) => id === `${lib.config.handoverPrefix}${b}`);
}

/** The card that hands the run over, first on the table, if the deck has one for the last reign's band. */
export function handoverCard(lib: Library, inh: Inheritance): string | null {
  const id = `${lib.config.handoverPrefix}${inh.band}`;
  return lib.cards.has(id) ? id : null;
}

/**
 * Whether a card would make what the country already has from the last reign, on either side:
 * a seawall to fund, a long ship to build. A card like that is not dealt to the run that took
 * it over (BACKLOG-10 phase 63).
 */
export function makesInherited(card: Card, state: Pick<GameState, "inherited">): boolean {
  const inherited = state.inherited?.legacies;
  if (!inherited || inherited.length === 0) return false;
  return inherited.some((f) => card.left.setFlags?.includes(f) || card.right.setFlags?.includes(f));
}

/**
 * Whether telling a story would leave what the country already has from the last reign: a
 * seawall to build, a question to answer. A story like that is not started; the country
 * settled it before this run began.
 */
export function settledByInheritance(lib: Library, state: Pick<GameState, "inherited">, arcId: string): boolean {
  const inherited = state.inherited?.legacies;
  if (!inherited || inherited.length === 0) return false;
  const sets = lib.arcSets.get(arcId);
  return !!sets && inherited.some((f) => sets.has(f));
}
