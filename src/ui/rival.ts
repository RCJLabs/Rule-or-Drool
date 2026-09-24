import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { electionBar, honestCount, rivalPressure } from "../engine/resolve";
import type { GameState } from "../engine/types";

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
  /** True once losing a vote would be their win by name, which is worth saying unprompted. */
  somebody: boolean;
}

export function rivalReport(lib: Library, state: GameState): RivalReport {
  const cfg = lib.config;
  const pressure = rivalPressure(lib, state);
  const { states, costs, takingNone, taking, wouldWin } = STRINGS.rival;
  const somebody = pressure >= cfg.rivalWinsAt;
  // The rungs are the thresholds the engine already has, not new ones: below where they
  // start costing you anything, above it, halfway to winning, and able to win.
  const half = Math.round((cfg.rivalStart + cfg.rivalWinsAt) / 2);
  // At exactly rivalStart the engine's `over` is zero, so the bottom rung is inclusive: a
  // fresh run reads as a rival who is costing nothing, because they are.
  const rung: RivalRung = pressure <= cfg.rivalStart ? 0 : pressure < half ? 1 : somebody ? 3 : 2;

  // What the standing is actually doing: the share of the coalition an honest vote needs,
  // over and above the floor it would need against nobody.
  const lift = electionBar(lib, state) - cfg.electionMoodThreshold;
  const behind = !honestCount(lib, state).wins;
  const cost =
    lift < 0.5 ? takingNone
    : `${taking.replace("{n}", lift.toFixed(1))}${somebody ? ` ${wouldWin}` : ""}${behind ? ` ${costs.behind}` : ""}`;
  return { rung, pressure, state: states[rung]!, cost, somebody };
}
