import { STRINGS } from "../content/strings";
import { deckAhead } from "../engine/draw";
import { withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { electionBar, honestCount, rivalPressure } from "../engine/resolve";
import { isRivalCard } from "../engine/rival";
import { hasFlag } from "../engine/state";
import type { Card, GameState } from "../engine/types";
import { coupWord } from "./coup";

/**
 * How the rival is doing, in the terms the rest of the game uses (BACKLOG-3 phase 24).
 *
 * The standing was computed every card and shown nowhere. It is not a seventh meter: the
 * game's rule is that nothing displays a number you are meant to feel, so this is a ladder
 * of four states read off the same `rivalPressure` the engine already acts on —
 * `standing + |drift| x rivalDriftPull`, which is to say what you banked for them plus how
 * far from the middle you have gone.
 *
 * Measured over 12,000 runs, the top rung is reached at 9.1% of a competent player's
 * elections and the rival has still never taken one: they only collect if you lose a vote,
 * and a competent coalition clears the bar by a median of 13 points. So the top rung says
 * what is actually true — they would win if you lost — rather than pretending a loss is
 * coming.
 *
 * What it costs you is said for the run as it stands (BACKLOG-11 phase 69). It spoke of ballots
 * after the vote was abolished, when what is left is the coup rolled in its place; and out of
 * office it called the rival who holds it a backbencher taking nothing off you.
 */
export type RivalRung = 0 | 1 | 2 | 3;

export interface RivalReport {
  rung: RivalRung;
  /** 0-100, the number the engine acts on. Not shown; used for tests and ordering. */
  pressure: number;
  /** What they are, in one clause. */
  state: string;
  /** What it is costing you right now, in one sentence. */
  cost: string;
  /** True once losing a vote would be their win by name. */
  somebody: boolean;
  /**
   * What they threaten now that is worth saying unprompted, on the button that opens the
   * cabinet: a vote lost to them by name, a coup whose risk is high, or the way back into
   * office lost. Null when there is nothing to say.
   */
  alert: string | null;
}

export function rivalReport(lib: Library, state: GameState): RivalReport {
  const cfg = lib.config;
  const pressure = rivalPressure(lib, state);
  const { states, costs, takingNone, taking, wouldWin, abolished, out } = STRINGS.rival;
  const somebody = pressure >= cfg.rivalWinsAt;
  // The rungs are the thresholds the engine already has, not new ones: below where they
  // start costing you anything, above it, halfway to winning, and able to win.
  const half = Math.round((cfg.rivalStart + cfg.rivalWinsAt) / 2);
  // At exactly rivalStart the engine's `over` is zero, so the bottom rung is inclusive: a
  // fresh run reads as a rival who is costing nothing, because they are.
  const rung: RivalRung = pressure <= cfg.rivalStart ? 0 : pressure < half ? 1 : somebody ? 3 : 2;
  const behind = !honestCount(lib, state).wins;

  // Out of office they hold it, and the vote that could win it back is the one that counts:
  // read as the return vote reads it, which is kinder than the vote that was lost.
  if (state.opposition) {
    const returns = state.opposition.returnAt !== null && state.opposition.returnAt !== undefined;
    const cost = !returns ? out.none : behind ? out.lose : out.win;
    return { rung, pressure, state: out.state, cost, somebody, alert: returns && behind ? out.alert : null };
  }

  // With the vote abolished there is no ballot to lose; the coup rolled in its place is the risk.
  if (hasFlag(state, cfg.electionsAbolishedFlag)) {
    const { band, word } = coupWord(lib, state);
    // Their share of it is their pressure over rivalStart (`coupRisk`), said from the rung the
    // cabinet shows them on: the roll's own pull on drift gives a backbencher a sliver of it too.
    const cost = `${abolished.cost.replace("{band}", word)}${rung > 0 ? ` ${abolished.adds}` : ""}`;
    return { rung, pressure, state: states[rung]!, cost, somebody, alert: band === "high" ? abolished.alert : null };
  }

  // What the standing is actually doing: the share of the coalition an honest vote needs,
  // over and above the floor it would need against nobody.
  const lift = electionBar(lib, state) - cfg.electionMoodThreshold;
  const cost =
    lift < 0.5 ? takingNone
    : `${taking.replace("{n}", lift.toFixed(1))}${somebody ? ` ${wouldWin}` : ""}${behind ? ` ${costs.behind}` : ""}`;
  return { rung, pressure, state: states[rung]!, cost, somebody, alert: somebody ? wouldWin : null };
}

/** How many of the deck's next cards are looked at for the rival's next move. Looking deeper warned no earlier, only more. */
export const MOVE_LOOK = 3;
/**
 * How much stronger than they are the rival is read as being, on the 0-100 their standing is kept
 * on. At 2, 92% of moves are shown a card or more ahead and a fifth of those shown never come; as
 * they stand, 70% and a sixth; at 3, 93% and a quarter.
 */
export const MOVE_REACH = 2;

/** One of the rival's moves the deal can bring: their card, not a vote, and not one only a choice sends. */
export function isRivalMove(card: Card): boolean {
  return card.type === "event" && isRivalCard(card) && (card.weight ?? 1) > 0;
}

/**
 * The rival's next move (BACKLOG-14 phase 90): the first of their moves among the next cards the
 * deck holds, read as it would stand with them a little stronger than they are, so a move is seen
 * before they are strong enough to make it. No card asks for the rival to be weak, so reading them
 * stronger brings their own moves into the deal and moves nothing else. Out of office the deal is
 * the opposition's own, and holds none.
 *
 * Measured on the daily's seeds, a person-like player is shown 57% of the moves that come three
 * cards or more before they come, and 92% one or more; of the moves shown, a fifth never come.
 * That is why it says what they are doing, never what will happen: a choice can put a move out of
 * reach, and anything else can come before it.
 */
export function rivalMove(lib: Library, state: GameState): Card | null {
  if (state.opposition || state.over) return null;
  const stronger = { ...state, rivalStanding: state.rivalStanding + MOVE_REACH };
  return deckAhead(lib, stronger, MOVE_LOOK).find(isRivalMove) ?? null;
}

/** The move in words, with their name in, and a seat they are courting named. */
export function rivalMoveLine(lib: Library, state: GameState, card: Card): string {
  const r = STRINGS.rival;
  const courting = card.left.poach || card.right.poach;
  const line = courting ? r.courting.replace("{role}", STRINGS.roles[card.speaker] ?? card.speaker) : (r.moves[card.id] ?? r.moving);
  return withNames(lib, state, line);
}
