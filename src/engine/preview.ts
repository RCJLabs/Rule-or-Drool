import { survivedTo } from "./endings";
import type { Library } from "./library";
import { applyChoice, checkOuster, honestCount, resolve, type HonestCount } from "./resolve";
import { fxDeltas } from "./state";
import type { Card, GameState, MeterKey, Meters, Side } from "./types";
import { METER_KEYS } from "./types";

export interface Preview {
  meters: Meters;
  drift: number;
  /** Ending this choice would trigger right now (choice ending, lost election or meter extreme). */
  endingId: string | null;
  /** Meters the choice touches; the UI shows these as dots without direction (section 9). */
  affected: MeterKey[];
  /** The run is out of office after this choice (BACKLOG-10 phase 55). */
  outOfOffice: boolean;
  /** How an honest count would go after this choice: what a campaign card moves (BACKLOG-10 phase 56). */
  count: HonestCount;
}

/** Project a choice without committing it. Deterministic and side-effect free. */
export function preview(lib: Library, state: GameState, card: Card, side: Side): Preview {
  const after = checkOuster(lib, applyChoice(lib, state, card, side));
  // Expand the `mood` shorthand, or a card that moves the whole coalition would show no
  // dots at all on the blocs it moves.
  const deltas = fxDeltas(card[side].fx);
  return {
    meters: after.meters,
    drift: after.drift,
    endingId: after.over?.endingId ?? null,
    affected: METER_KEYS.filter((k) => (deltas[k] ?? 0) !== 0),
    outOfOffice: !!after.opposition,
    count: honestCount(lib, after),
  };
}

/**
 * The ending this side brings on the card it is played on, where the rules a player is shown
 * decide it (BACKLOG-11 phase 68): the side's own ending, a lost count that ends the run, a meter
 * the side takes over an edge, or one the era's pressure takes over once it is played. Not the
 * coup's roll, which is dice the player is not shown, and not a finale, which is the run seen
 * through. Null for a side that leaves the run going. It plays the card, which `preview` does
 * not, since the era's pressure and a vote's rules come after the choice.
 */
export function sideEnds(lib: Library, state: GameState, card: Card, side: Side): string | null {
  if (state.over || state.current !== card.id) return null;
  const id = resolve(lib, state, card.id, side).over?.endingId ?? null;
  if (!id || survivedTo(lib.config, id)) return null;
  if (id === lib.config.coupEnding && card[side].ending !== id) return null;
  return id;
}
