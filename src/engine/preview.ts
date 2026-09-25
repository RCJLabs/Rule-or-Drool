import type { Library } from "./library";
import { applyChoice, checkOuster, honestCount, type HonestCount } from "./resolve";
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
