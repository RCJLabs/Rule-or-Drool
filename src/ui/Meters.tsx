import type { Preview } from "../engine/preview";
import type { Meters } from "../engine/types";
import { METER_KEYS } from "../engine/types";
import { MeterIcon } from "./MeterIcon";
import { meterLabel, type Theme } from "./theme";

interface Props {
  meters: Meters;
  /** Projection of the side being dragged or peeked, or null when the card is at rest. */
  preview: Preview | null;
  theme: Theme;
}

export const DANGER_BELOW = 15;

export function MetersBar({ meters, preview, theme }: Props) {
  return (
    <header className="meters">
      {METER_KEYS.map((k) => {
        const affected = preview?.affected.includes(k) ?? false;
        const delta = preview ? Math.abs(preview.meters[k] - meters[k]) : 0;
        const dot = !affected ? 0 : delta <= 2 ? 1 : delta <= 5 ? 2 : 3;
        const v = meters[k];
        return <MeterIcon key={k} meter={k} value={v} dot={dot} danger={v < DANGER_BELOW || v > 100 - DANGER_BELOW} label={meterLabel(k, theme)} />;
      })}
    </header>
  );
}
