import { STRINGS } from "../content/strings";
import { MANDATES_BY_ID } from "../engine/mandates";
import type { GameState } from "../engine/types";

/**
 * The promise, where the run can see it. Breaking one is said properly by a card a couple
 * of draws later; this is only the standing record of which way it is (phase 16).
 *
 * A platform's two share one line by their short names (BACKLOG-10 phase 62): a second line
 * took up to 16px off the card at 360×640, which the longest cards did not have. Each still
 * says which way it is going, in its mark and its strike, and in words to a screen reader.
 */
export function MandateBadge({ state }: { state: GameState }) {
  const promises = state.mandates.flatMap((id) => {
    const mandate = MANDATES_BY_ID.get(id);
    return mandate ? [{ mandate, broken: id in state.mandatesBroken }] : [];
  });
  if (promises.length === 0) return null;
  if (promises.length === 1) {
    const [{ mandate, broken }] = promises as [(typeof promises)[number]];
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
  return (
    <p className="mandate-badge pair" role="status">
      {promises.map(({ mandate, broken }) => (
        <span key={mandate.id} className={`mandate-one${broken ? " broken" : ""}`}>
          <span className="mandate-mark" aria-hidden="true">
            {broken ? "✕" : "✓"}
          </span>
          <b>{mandate.short}</b>
          <span className="sr-only">{broken ? STRINGS.ui.mandateBroken : STRINGS.ui.mandateHolding}</span>
        </span>
      ))}
    </p>
  );
}
