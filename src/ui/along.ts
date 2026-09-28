import { deckStamp } from "../engine/deck";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { runCodeOf, theirRun, type RunResult } from "../meta";

/**
 * The run someone sent, dealt again from their link beside the receiver's (BACKLOG-14 phase 89),
 * for saying card by card what they did. None on a second road, which is not a comparison with
 * them, nor from a link that names another deck, whose cards were not the ones they saw.
 */
export function theirRunFor(lib: Library, state: GameState, challenge: RunResult | null): GameState | null {
  if (!challenge?.sides || state.road) return null;
  if (challenge.deck && challenge.deck !== deckStamp(lib)) return null;
  return theirRun(lib, runCodeOf(state), challenge);
}
