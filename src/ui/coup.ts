import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { coupDue, coupOdds } from "../engine/resolve";
import type { GameState } from "../engine/types";

/**
 * The coup roll, said where a vote's count would be (BACKLOG-11 phase 69). Once the vote is
 * abolished, each place it would have fallen due is a roll against Order, the State and the
 * rival's standing (`coupRisk`), and nothing on the table said so: every one of the mixed bot's
 * rival wins in 2,000 long reigns came from that roll, and none could be seen coming.
 *
 * In words, as the count is: a band and never the number, since a number makes a gamble of what
 * is a threat. The odds are read as the run stands, the roll's own pull on drift included; what
 * the card on the table does to the meters is not. Over 504 rolls in 20,000 bot runs, the side
 * taken moved the odds into another band 9 times.
 */
export type CoupBand = "low" | "moderate" | "high";

/** At or under this the risk is low: one in ten or so at most. The floor is one in twenty. */
export const LOW_UP_TO = 0.12;
/** Over this it is high: one in three or worse. */
export const HIGH_OVER = 0.3;

export function coupBand(risk: number): CoupBand {
  return risk <= LOW_UP_TO ? "low" : risk <= HIGH_OVER ? "moderate" : "high";
}

export interface CoupLine {
  band: CoupBand;
  text: string;
}

/** The risk of a coup as it stands, in the words the card and the cabinet both use. */
export function coupWord(lib: Library, state: GameState): { band: CoupBand; word: string } {
  const band = coupBand(coupOdds(lib, state));
  return { band, word: STRINGS.coup.bands[band] };
}

/** The line for the card on the table when the roll comes once it is played; null on any other. */
export function coupLine(lib: Library, state: GameState): CoupLine | null {
  if (!state.current || !coupDue(lib, state)) return null;
  const { band, word } = coupWord(lib, state);
  return { band, text: STRINGS.coup.line.replace("{band}", word) };
}
