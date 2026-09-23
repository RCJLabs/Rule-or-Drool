import { useEffect, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { LEGACIES } from "../meta/legacies";

interface Props {
  lib: Library;
  /** The state as it is on the far side of the boundary, which is what carried over. */
  state: GameState;
  era: number;
  /** Instant rather than staged, when the player has asked for less movement. */
  reduceMotion: boolean;
  onContinue: () => void;
}

/** How many of the country's legacies to name before counting the rest. */
const NAMED = 4;

/**
 * The era boundary (BACKLOG-3 phase 25). It is the largest structural event in a run — a
 * successor takes office, the band is recomputed, the meters are pulled toward the middle,
 * the era's standing pressure changes and the deck's era filter moves — and it used to be a
 * modal card with a heading and two lines in front of the look, which is the one thing it
 * should not be.
 *
 * It takes the whole frame now and is rendered in the era it is arriving into, so the look
 * changes *here* rather than behind a dialog. Measured over 11,762 crossings, none of them
 * arrives empty-handed: a competent run carries 3.9 named legacies into era 2 and 5.5 into
 * era 3, with 2.2 to 3.4 decisions still owed. The cabinet is left out on the same evidence
 * — 8.3 of the 9 are there from the first day, so its tenure says nothing at a boundary.
 */
export function EraTransition({ lib, state, era, reduceMotion, onContinue }: Props) {
  const info = STRINGS.eras[era - 1];
  const rule = STRINGS.eraRules[era - 1];
  const carried = state.flags.filter((f) => LEGACIES[f]).map((f) => LEGACIES[f]!);
  const owed = state.queue.length;
  // Only what is on the panel: an era with nothing owed or no new rule has no such line.
  const described = ["era-lead", owed > 0 ? "era-owed" : "", rule ? "era-rule" : ""].filter(Boolean).join(" ");

  // Three beats rather than one page: the years, then what they were left with, then the
  // rule that is different now. Time passing is the point, so it is not instant.
  const [beat, setBeat] = useState(reduceMotion ? 3 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    const timers = [450, 1000, 1550].map((ms, i) => setTimeout(() => setBeat((b) => Math.max(b, i + 1)), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    // Focus lands on Continue, so the panel's own words are its description: without it a
    // screen reader arrives, hears "Continue" and nothing of the twenty years (BACKLOG-5
    // phase 30).
    <div className="era-jump" role="dialog" aria-modal="true" aria-labelledby="era-title" aria-describedby={described} data-beat={beat}>
      <div className="era-jump-inner">
        <p className="kicker">{STRINGS.ui.eraKicker.replace("{n}", String(era))}</p>
        <h2 id="era-title">{info?.name ?? `Era ${era}`}</h2>
        <p className="era-jump-lead" id="era-lead">
          {info?.jump ?? "Time passes."}
        </p>

        {carried.length > 0 && (
          <div className="era-carried">
            <p className="kicker">{STRINGS.ui.carried}</p>
            <ul>
              {carried.slice(0, NAMED).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {carried.length > NAMED && <p className="era-more">{STRINGS.ui.andMore.replace("{n}", String(carried.length - NAMED))}</p>}
          </div>
        )}
        {owed > 0 && (
          <p className="era-owed" id="era-owed">
            {(owed === 1 ? STRINGS.ui.owedOne : STRINGS.ui.owed).replace("{n}", String(owed))}
          </p>
        )}

        {rule ? (
          <p className="era-rule" id="era-rule">
            {rule}
          </p>
        ) : null}
        <button type="button" className="primary" onClick={onContinue} autoFocus>
          {STRINGS.ui.continueEra}
        </button>
      </div>
    </div>
  );
}
