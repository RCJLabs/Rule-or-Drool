import { STRINGS } from "../content/strings";
import { MANDATES_BY_ID } from "../engine/mandates";
import type { GameState } from "../engine/types";

/**
 * The promise, where the run can see it. Breaking one is said properly by a card a couple
 * of draws later; this is only the standing record of which way it is (phase 16).
 */
export function MandateBadge({ state }: { state: GameState }) {
  if (!state.mandate) return null;
  const mandate = MANDATES_BY_ID.get(state.mandate);
  if (!mandate) return null;
  const broken = state.mandateBrokenAt !== null;
  return (
    <p className={`mandate-badge${broken ? " broken" : ""}`} role="status">
      <span className="mandate-mark" aria-hidden="true">
        {broken ? "✕" : "✓"}
      </span>
      <b>{mandate.title}</b>
      <span className="mandate-state">{broken ? STRINGS.ui.mandateBroken : STRINGS.ui.mandateHolding}</span>
    </p>
  );
}
