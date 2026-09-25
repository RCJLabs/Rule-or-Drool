import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { HISTORY_ORDER } from "../meta/histories";
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
  // A run that ended out of office: at the finale, at the return vote, or when its coalition
  // left it there (BACKLOG-10 phase 55).
  if (state.opposition) lines.push(STRINGS.opposition.endedOut);

  if (fired === 0) lines.push(room.nobody);
  else if (originals > 0) lines.push(plural(fired, room.someOne, room.someMany).replace("{k}", String(originals)));
  else lines.push(plural(fired, room.allOne, room.allMany));

  const carried = state.flags.filter((f) => LEGACIES[f]).map((f) => LEGACIES[f]!);
  lines.push(carried.length === 0 ? carrying.nothing : plural(carried.length, carrying.one, carrying.many));
  return { lines, carried };
}

/**
 * How the run went, in order (post-run histories): when you took office, the decisions that
 * left something behind, the years passing, a promise breaking, and how it ended. The card
 * each decision was made on is what the run dates its flags with; a flag from a save that
 * predates the dating has no card and is left out rather than placed at the start.
 */
export interface Moment {
  at: number;
  kind: "start" | "decision" | "era" | "promise" | "end";
  text: string;
}

/** Most decisions a timeline names. The rest are in the codex; ten lines is a page. */
export const TIMELINE_DECISIONS = 8;

export function timeline(lib: Library, state: GameState, endingTitle: string): Moment[] {
  const { took, inheriting, broke } = STRINGS.timeline;
  const crisis = state.modifiers.map((m) => STRINGS.modifiers[m as keyof typeof STRINGS.modifiers]).find((m, i) => m && state.modifiers[i]!.startsWith("crisis_"));
  const start = took.replace("{party}", STRINGS.parties[state.align]) + (crisis ? `, ${inheriting.replace("{crisis}", crisis.name.toLowerCase())}` : "") + ".";
  const moments: Moment[] = [{ at: 0, kind: "start", text: start }];

  // The biggest decisions, if there are more than fit, told in the order they were made.
  const dated = HISTORY_ORDER.filter((f) => state.flags.includes(f) && state.flagSince?.[f] !== undefined && state.flagSince[f]! > 0);
  for (const f of dated.slice(0, TIMELINE_DECISIONS)) moments.push({ at: state.flagSince[f]!, kind: "decision", text: LEGACIES[f] ?? f });

  for (let era = 2; era <= state.era; era++) {
    moments.push({ at: (era - 1) * lib.config.eraLength, kind: "era", text: STRINGS.eras[era - 1]?.name ?? `Era ${era}` });
  }
  if (state.mandate && state.mandateBrokenAt !== null) moments.push({ at: state.mandateBrokenAt, kind: "promise", text: broke });
  moments.push({ at: state.cardCount, kind: "end", text: endingTitle });

  // A decision made on the card that tipped the era happened before the years passed.
  const order: Record<Moment["kind"], number> = { start: 0, decision: 1, promise: 2, era: 3, end: 4 };
  return moments.sort((a, b) => a.at - b.at || order[a.kind] - order[b.kind]);
}
