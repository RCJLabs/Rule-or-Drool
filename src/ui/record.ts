import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { LEGACIES } from "../meta/legacies";

/**
 * What the run actually did, for the endings a player reaches by surviving
 * (BACKLOG-3 phase 27).
 *
 * `finale_muddle` is 64.2% of a competent player's endings and it drew two texts, not the
 * six the backlog assumed: the epilogue is keyed `band:align:era` and a run that survives all
 * three eras always has era 3, so a player who finishes ten runs reads `muddle:left:3` or
 * `muddle:right:3` every single time.
 *
 * The material to tell them apart was already in the state and unused. Measured over 1,925
 * muddle finales: legacies carried spread 3-9, advisors let go 0-3, originals still in the
 * room 5-9, honest wins 0-3 against 0-3 counted twice — **67.9% of them already have a
 * combination of facts no other run in the sweep had.**
 */
export interface RunRecord {
  /** One sentence each, in the order they are read. Only the true ones are here. */
  lines: string[];
  /** What the country is left carrying, as the era jump names it. */
  carried: string[];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many).replace("{n}", String(n));

export function runRecord(lib: Library, state: GameState): RunRecord {
  const { votes, room, carrying } = STRINGS.record;
  const honest = state.stats.electionsHonest;
  const cheated = state.stats.electionsCheated;
  const fired = state.stats.firedAdvisors.length;
  // The rival was never yours to keep, so they do not count as someone who stayed.
  const originals = Object.entries(state.cabinetSince).filter(([role, since]) => since === 0 && role !== lib.config.rivalRole).length;

  const lines: string[] = [];
  const won = plural(honest, votes.wonOne, votes.wonMany);
  if (honest > 0 && cheated > 0) {
    lines.push(votes.mixed.replace("{won}", won).replace("{cheated}", plural(cheated, votes.cheatedOne, votes.cheatedMany)));
  } else if (honest > 0) lines.push(votes.clean.replace("{won}", won));
  else if (cheated > 0) lines.push(votes.neverClean);
  else lines.push(votes.none);

  if (fired === 0) lines.push(room.nobody);
  else if (originals > 0) lines.push(plural(fired, room.someOne, room.someMany).replace("{k}", String(originals)));
  else lines.push(plural(fired, room.allOne, room.allMany));

  const carried = state.flags.filter((f) => LEGACIES[f]).map((f) => LEGACIES[f]!);
  lines.push(carried.length === 0 ? carrying.nothing : plural(carried.length, carrying.one, carrying.many));
  return { lines, carried };
}
