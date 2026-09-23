import { STRINGS } from "../content/strings";

interface Props {
  /** The long reign's era count, or undefined for the ordinary game. */
  value: number | undefined;
  longEraCount: number;
  onChange: (eraCount: number | undefined) => void;
}

/**
 * Three eras or five (BACKLOG-5 phase 39). Shown only once the long reign is open, and it says
 * the one thing that changes how a long reign plays: after the third era, the direction is set.
 */
export function ReignPicker({ value, longEraCount, onChange }: Props) {
  const r = STRINGS.reign;
  return (
    <fieldset className="mandates reign">
      <legend>{r.legend}</legend>
      <button type="button" className={`mandate-choice${value === undefined ? " selected" : ""}`} aria-pressed={value === undefined} onClick={() => onChange(undefined)}>
        <b>{r.ordinary}</b>
        <span>{r.ordinaryBlurb}</span>
      </button>
      <button
        type="button"
        className={`mandate-choice${value === longEraCount ? " selected" : ""}`}
        aria-pressed={value === longEraCount}
        onClick={() => onChange(longEraCount)}
      >
        <b>{r.long}</b>
        <span>{r.longBlurb}</span>
      </button>
    </fieldset>
  );
}
