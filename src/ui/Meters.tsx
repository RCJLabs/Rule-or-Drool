import type { Preview } from "../engine/preview";
import type { Meters, PlayerAlign } from "../engine/types";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import { MeterIcon } from "./MeterIcon";
import { meterLabel, type Theme } from "./theme";

interface Props {
  meters: Meters;
  /** Projection of the side being dragged or peeked, or null when the card is at rest. */
  preview: Preview | null;
  theme: Theme;
  align: PlayerAlign;
}

export const DANGER_BELOW = 15;

/**
 * Six meters now: the three coalition blocs, then the three that belong to the state.
 * The gap between the groups is deliberate; they fail in different ways (BACKLOG item 5).
 */
export function MetersBar({ meters, preview, theme, align }: Props) {
  return (
    <header className="meters">
      {METER_KEYS.map((k) => {
        const affected = preview?.affected.includes(k) ?? false;
        const delta = preview ? Math.abs(preview.meters[k] - meters[k]) : 0;
        const dot = !affected ? 0 : delta <= 2 ? 1 : delta <= 5 ? 2 : 3;
        const v = meters[k];
        const isBloc = (BLOC_KEYS as readonly string[]).includes(k);
        // A bloc only ends the run at the bottom, so only the bottom is dangerous.
        const danger = isBloc ? v < DANGER_BELOW : v < DANGER_BELOW || v > 100 - DANGER_BELOW;
        return (
          <div key={k} className={`meter-slot${k === "money" ? " group-break" : ""}`}>
            <MeterIcon meter={k} value={v} dot={dot} danger={danger} label={meterLabel(k, theme, align)} />
          </div>
        );
      })}
    </header>
  );
}
