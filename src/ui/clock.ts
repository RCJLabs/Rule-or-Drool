import { STRINGS } from "../content/strings";
import type { GameState, MeterKey } from "../engine/types";
import { LONG_REIGN, ON_THE_CLOCK } from "../meta/types";

/**
 * On the clock (BACKLOG-13 phase 93), as the screen shows it: the pips under a meter in danger at
 * its bottom, one for each decision it has left, and the same in words.
 */

/** The pips under a meter: the decisions it has left of the run's clock, or null when none are running. */
export function pipsOf(state: Pick<GameState, "clock" | "dangerLeft">, k: MeterKey): { left: number; of: number } | null {
  const left = state.dangerLeft?.[k];
  return state.clock && left !== undefined && left > 0 ? { left, of: state.clock } : null;
}

/** The decisions left, in words: "3 decisions left". */
export function leftWords(left: number): string {
  return left === 1 ? STRINGS.clock.leftOne : STRINGS.clock.left.replace("{n}", String(left));
}

/** What completing an objective opens, in words: once opened, and before. */
export const OPENS: Readonly<Record<typeof LONG_REIGN | typeof ON_THE_CLOCK, { opened: string; opens: string }>> = {
  [LONG_REIGN]: { opened: STRINGS.reign.opened, opens: STRINGS.reign.opens },
  [ON_THE_CLOCK]: { opened: STRINGS.clock.opened, opens: STRINGS.clock.opens },
};
