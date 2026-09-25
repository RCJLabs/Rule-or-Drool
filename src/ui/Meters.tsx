import { STRINGS } from "../content/strings";
import type { Preview } from "../engine/preview";
import type { GameState, Meters, PlayerAlign } from "../engine/types";
import type { Library } from "../engine/library";
import { nearMisses } from "../engine/endings";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import { MeterIcon } from "./MeterIcon";
import { meterLevel, meterName, stepOf } from "./speech";
import { meterLabel, type Theme } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  meters: Meters;
  /** Projection of the side being dragged or peeked, or null when the card is at rest. */
  preview: Preview | null;
  theme: Theme;
  align: PlayerAlign;
}

export const DANGER_BELOW = 15;
/** A bloc this low is visibly unhappy, well before it is dangerous (BACKLOG-2 phase 8). */
export const RESTLESS_BELOW = 32;
/** How close an ending has to be before the run is told which one it is (phase 13). */
export const NEAR_WITHIN = 12;

/**
 * Which bloc is the unhappiest, if any is unhappy enough to name. The coalition is three
 * groups with different interests now, so "support is low" is not a useful thing to tell
 * the player: they need to know *who*.
 */
export function restlessBloc(meters: Meters): (typeof BLOC_KEYS)[number] | null {
  let worst: (typeof BLOC_KEYS)[number] | null = null;
  for (const b of BLOC_KEYS) {
    if (meters[b] >= RESTLESS_BELOW) continue;
    if (!worst || meters[b] < meters[worst]) worst = b;
  }
  return worst;
}

/**
 * Six meters now: the three coalition blocs, then the three that belong to the state.
 * The gap between the groups is deliberate; they fail in different ways (BACKLOG item 5).
 */
export function MetersBar({ lib, state, meters, preview, theme, align }: Props) {
  const restless = restlessBloc(meters);
  // The nearest ending, named, so a run that is five points from one knows it (phase 13).
  const near = nearMisses(lib, state, NEAR_WITHIN)[0];
  const nearTitle = near ? lib.endings.get(near.endingId)?.title : undefined;
  return (
    <header className="meters">
      {METER_KEYS.map((k) => {
        const affected = preview?.affected.includes(k) ?? false;
        const delta = preview ? Math.abs(preview.meters[k] - meters[k]) : 0;
        const dot = !affected ? 0 : stepOf(delta);
        const v = meters[k];
        const isBloc = (BLOC_KEYS as readonly string[]).includes(k);
        // A bloc only ends the run at the bottom, so only the bottom is dangerous.
        // Out of office only the coalition can end the run (BACKLOG-10 phase 55).
        const danger = isBloc ? v < DANGER_BELOW : !state.opposition && (v < DANGER_BELOW || v > 100 - DANGER_BELOW);
        return (
          <div key={k} className={`meter-slot${k === "money" ? " group-break" : ""}${k === restless ? " restless" : ""}`}>
            <MeterIcon
              meter={k}
              value={v}
              dot={dot}
              danger={danger}
              label={meterLabel(k, theme, align)}
              spoken={`${meterName(k, align)}, ${meterLevel(k, v, danger)}`}
            />
          </div>
        );
      })}
      {nearTitle ? (
        <p className="near-note" role="status">
          {STRINGS.ui.nearEnding} <b>{nearTitle}</b>
        </p>
      ) : (
        restless && (
          <p className="restless-note" role="status">
            {STRINGS.blocNames[align][restless]} {STRINGS.blocRestless[restless]}
          </p>
        )
      )}
    </header>
  );
}
